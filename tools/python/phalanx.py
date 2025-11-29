import sys
import os
import argparse # Ensure argparse is imported for the new class
import json # ensure json is imported
import re # ensure re is imported
import datetime # ensure datetime is imported
import uuid # ensure uuid is imported
import requests # ensure requests is imported
import time # ensure time is imported
import hashlib # ensure hashlib is imported
from typing import List, Tuple, Dict # ensure typing is imported
from html import escape # ensure html is imported
import unicodedata # ensure unicodedata is imported
from pydantic import ValidationError # ensure pydantic is imported


# --- BEGIN PHALANX Modernization ---
# Get the directory of this script (phalanx.py in project root)
# This assumes phalanx.py is in the project root, alongside PHALANX_workspace
_phalanx_py_dir = os.path.dirname(os.path.abspath(__file__))

# Path to the PHALANX_workspace, relative to this script's location
_phalanx_workspace_parent_dir = _phalanx_py_dir # Project root
_phalanx_package_dir = os.path.join(_phalanx_workspace_parent_dir, "PHALANX_workspace")

# Add the directory containing the 'phalanx' package (i.e., PHALANX_workspace) to sys.path
if _phalanx_package_dir not in sys.path:
    sys.path.insert(0, _phalanx_package_dir)
    print(f"INFO: Added '{_phalanx_package_dir}' to sys.path.", flush=True)

# Now import from the packaged PHALANX system
try:
    # ESSENTIAL_CONFIG is now dynamically configured based on PHALANX_INVOCATION_CWD
    from phalanx.core.config import ESSENTIAL_CONFIG
    from phalanx.core.config_manager import initialize_config, get_config_manager, ConfigManager
    
    # Ensure PHALANX_INVOCATION_CWD is set. 
    # Since this phalanx.py is the main entry point, it defines the project root.
    if "PHALANX_INVOCATION_CWD" not in os.environ:
        os.environ["PHALANX_INVOCATION_CWD"] = _phalanx_py_dir
        print(f"INFO: PHALANX_INVOCATION_CWD auto-set to project root: {_phalanx_py_dir}", flush=True)
    
    # Initialize the configuration manager with the packaged config
    # This ESSENTIAL_CONFIG uses PHALANX_INVOCATION_CWD correctly due to prior edits in phalanx/core/config.py
    initialize_config(ESSENTIAL_CONFIG)
    config_manager = get_config_manager() # Get the singleton instance
    
    # Make the loaded config accessible similarly to how legacy ESSENTIAL_CONFIG was used,
    # to minimize initial refactoring. For full modernization, direct config_manager usage is preferred.
    ESSENTIAL_CONFIG_LOADED = config_manager.get_config()
    
    print(f"INFO: Successfully initialized config from phalanx.core. PHALANX_ROOT: {config_manager.get_phalanx_root()}", flush=True)

    # Import the new main entry point
    from phalanx.cli import main as phalanx_cli_main
    # Import other necessary components that were previously top-level in this script
    from phalanx.llm.consultation import PerplexityCoTParser
    from phalanx.core.episodic_memory import Episode, SimpleVectorStore


except ImportError as e:
    print(f"ERROR: Could not import from packaged PHALANX. Ensure PHALANX_workspace/phalanx exists and is structured correctly: {e}", file=sys.stderr)
    print(f"Current sys.path: {sys.path}", file=sys.stderr)
    # Fallback for critical components if package loading fails, so script can still potentially run with internal defs
    PerplexityCoTParser = None 
    Episode = None
    SimpleVectorStore = None
    print(f"WARNING: Falling back on internal definitions for some components due to ImportError: {e}", file=sys.stderr)
    # sys.exit(1) # Keep running for now, rely on later checks for missing components

# --- END PHALANX Modernization ---

# Definition of the custom Zsh-aware argument parser
class PhalanxZshAwareArgumentParser(argparse.ArgumentParser):
    def error(self, message: str):
        # Mimic the way ArgumentParser formats and prints its own error messages
        sys.stderr.write(f'{self.prog}: error: {message}\n')

        current_shell = os.environ.get('SHELL', '')
        if 'zsh' in current_shell.lower():
            zsh_help = """
\n---------------------------------------------------------------------
PHALANX Zsh Shell Troubleshooting Tip:
You are using Zsh, and an error occurred parsing command-line arguments.
This might be because Zsh misinterpreted special characters (like parentheses,
quotes, asterisks) in your arguments BEFORE they reached PHALANX.

To ensure Zsh passes arguments to PHALANX literally:

1.  Wrap Problematic Argument Values in SINGLE QUOTES ('').
    This applies to values for --query, --details, --key_takeaway, etc.
    Example: --details 'My complex (text) with *stars*.'

2.  If the Argument Value ITSELF Contains a SINGLE QUOTE (e.g., "it's"):
    You MUST replace that inner single quote with the sequence: '\''.
    (This sequence means: close current quote, add an escaped literal
    single quote, then reopen the quote.)
    Example: --details 'The captain'\''s log contains vital data.'
    This correctly passes the string "The captain's log contains vital data."

    Incorrect: --details 'The captain's log'  (Zsh will likely break this)
    Correct:   --details 'The captain'\''s log'

3.  For Multi-line Text:
    Convert to a single line using spaces where newlines were. Or, Zsh allows
    literal newlines within single quotes if you press Enter during input
    (a continuation prompt like '>' will appear). Be aware that embedded
    newlines might affect how PHALANX processes the string.

Applying these shell quoting rules often resolves argument parsing issues.
NOTE: This advice helps if PHALANX's argument parser failed. If Zsh itself
showed an error like "zsh: parse error near...", that's a shell-level error
that prevented PHALANX from even starting. The quoting rules above are also
the solution for those shell-level errors.
---------------------------------------------------------------------
"""
            sys.stderr.write(zsh_help)
        sys.exit(2) # Standard exit code for argparse errors

# --- Restored Original Code (Helper functions, classes, command handlers) ---

class PhalanxError(Exception):
    """Base class for custom exceptions in the PHALANX system."""
    def __init__(self, message, context=None):
        super().__init__(message)
        self.message = message
        self.context = context if context is not None else {}

    def __str__(self):
        if self.context:
            return f"{self.message} [Context: {json.dumps(self.context)}]"
        return self.message

def validate_config():
    """Validates ESSENTIAL_CONFIG structure and content (Enhanced from Doc 11)."""
    print("Validating ESSENTIAL_CONFIG...")
    # Use ESSENTIAL_CONFIG_LOADED which is populated from the config manager
    config_to_validate = ESSENTIAL_CONFIG_LOADED 

    required_top_keys = ["phalanx_root", "roles", "directories", "files", "agent_profiles", "doc_templates"]
    
    missing_keys = [key for key in required_top_keys if key not in config_to_validate]
    if missing_keys:
        raise PhalanxError(f"ESSENTIAL_CONFIG missing top-level keys", context={"missing_keys": missing_keys})
        
    type_validations = {
        "phalanx_root": str,
        "roles": list,
        "directories": dict,
        "files": dict,
        "agent_profiles": dict,
        "doc_templates": dict
    }
    
    for key, expected_type in type_validations.items():
        if key not in config_to_validate: # Check if key exists before type validation
            continue 
        if not isinstance(config_to_validate[key], expected_type):
            raise PhalanxError(f"ESSENTIAL_CONFIG['{key}'] type mismatch", 
                               context={"key": key, "expected": expected_type.__name__, "found": type(config_to_validate[key]).__name__})
            
    if not config_to_validate["roles"]:
        raise PhalanxError("ESSENTIAL_CONFIG['roles'] must not be empty.")
    
    if not config_to_validate["directories"].get("lessons"):
        raise PhalanxError("ESSENTIAL_CONFIG['directories'] missing 'lessons' path.")

    if not config_to_validate["directories"].get("llm_qa_logs"):
        raise PhalanxError("ESSENTIAL_CONFIG['directories'] missing 'llm_qa_logs' path.")

    for doc_type, template_content in config_to_validate["doc_templates"].items():
        if not isinstance(template_content, str):
            raise PhalanxError(f"Template for '{doc_type}' must be a string, not {type(template_content).__name__}.",
                               context={"doc_type": doc_type, "template_type": type(template_content).__name__})
        required_placeholders = ["{title}", "{date}", "{unique_id}"] 
        if doc_type == "fmea_entry":
            required_placeholders.extend(["{risk_level}", "{related_component}"])
        
        missing_placeholders_for_type = [p for p in required_placeholders if p not in template_content]
        if missing_placeholders_for_type:
            print(f"WARNING: Template for '{doc_type}' may be missing expected placeholders: {missing_placeholders_for_type}", file=sys.stderr)
            
    print("ESSENTIAL_CONFIG validation passed (structure, types, basic content).")

def log_audit(role, action, details):
    """Logs an audit trail entry (Simplified version)."""
    config = ESSENTIAL_CONFIG_LOADED
    timestamp = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    log_message = f"{timestamp} - ROLE: {role}, ACTION: {action}, DETAILS: {details}"
    print(f"AUDIT: {log_message}") 
    
    audit_log_file_path = None
    try:
        audit_log_config = config.get("files", {}).get("audit_log")
        if audit_log_config and isinstance(audit_log_config, str):
            phalanx_root = config.get("phalanx_root")
            if not os.path.isabs(audit_log_config) and phalanx_root:
                audit_log_file_path = os.path.join(phalanx_root, audit_log_config)
            else:
                audit_log_file_path = audit_log_config
            audit_log_file_path = os.path.normpath(audit_log_file_path)
            with open(audit_log_file_path, "a", encoding='utf-8') as f:
                f.write(log_message + "\n")
    except Exception as e:
        print(f"ERROR (log_audit): Failed to write to actual audit log file '{audit_log_file_path if audit_log_file_path else 'Not Configured'}': {e}", file=sys.stderr)

# --- LLM Caching Functions ---
def get_cached_response(query_text, agent_profile_name):
    config = ESSENTIAL_CONFIG_LOADED
    phalanx_root = config.get("phalanx_root")
    if not phalanx_root:
        log_audit("CACHE_SYSTEM", "Cache Warning", "phalanx_root not defined, LLM cache disabled.")
        return None
    cache_dir_config = config.get("directories", {}).get("llm_cache")
    if not cache_dir_config:
        log_audit("CACHE_SYSTEM", "Cache Warning", "llm_cache directory not configured, LLM cache disabled.")
        return None
    cache_dir = os.path.join(phalanx_root, cache_dir_config)
    query_hash = hashlib.md5(f"{query_text}_{agent_profile_name}".encode('utf-8')).hexdigest()
    cache_path = os.path.join(cache_dir, f"{query_hash}.json")
    if os.path.exists(cache_path):
        if time.time() - os.path.getmtime(cache_path) < 86400:
            try:
                with open(cache_path, 'r', encoding='utf-8') as f:
                    log_audit("CACHE_SYSTEM", "Cache Hit", f"Query hash: {query_hash}, Profile: {agent_profile_name}")
                    return json.load(f)
            except Exception as e:
                log_audit("CACHE_SYSTEM", "Cache Error", f"Read error for {cache_path}: {str(e)}")
        else:
            log_audit("CACHE_SYSTEM", "Cache Stale", f"Cache file {cache_path} too old.")
    return None

def cache_response(query_text, agent_profile_name, response):
    config = ESSENTIAL_CONFIG_LOADED
    phalanx_root = config.get("phalanx_root")
    if not phalanx_root:
        log_audit("CACHE_SYSTEM", "Cache Store Warning", "phalanx_root not defined, LLM response not cached.")
        return
    cache_dir_config = config.get("directories", {}).get("llm_cache")
    if not cache_dir_config:
        log_audit("CACHE_SYSTEM", "Cache Store Warning", "llm_cache directory not configured, LLM response not cached.")
        return
    cache_dir = os.path.join(phalanx_root, cache_dir_config)
    query_hash = hashlib.md5(f"{query_text}_{agent_profile_name}".encode('utf-8')).hexdigest()
    cache_path = os.path.join(cache_dir, f"{query_hash}.json")
    try:
        with open(cache_path, 'w', encoding='utf-8') as f:
            json.dump(response, f, indent=2)
        log_audit("CACHE_SYSTEM", "Cache Stored", f"Query hash: {query_hash}, Profile: {agent_profile_name}")
    except Exception as e:
        log_audit("CACHE_SYSTEM", "Cache Store Error", f"Failed to write to {cache_path}: {str(e)}")

# --- LLM Context Preservation Functions ---
def create_context_file(args, context_type: str, content: str) -> str:
    config = ESSENTIAL_CONFIG_LOADED
    phalanx_root = config.get("phalanx_root")
    if not phalanx_root:
        raise PhalanxError("phalanx_root not defined", context={"missing_config": "phalanx_root"})
    context_dir_config = config.get("directories", {}).get("context")
    if not context_dir_config:
        raise PhalanxError("Context directory not configured", context={"missing_config": "directories.context"})
    context_dir = os.path.join(phalanx_root, context_dir_config)
    session_id = getattr(args, 'session_id', 'unknown_session')
    filename = f"{session_id}_{slugify(context_type)}.txt"
    filepath = os.path.join(context_dir, filename)
    try:
        write_safely(filepath, content)
        log_audit(args.role, f"Context Saved ({context_type})", f"File: {filepath}, Session: {session_id}")
        return filepath
    except PhalanxError as e:
        log_audit(args.role, f"Context Save Failed ({context_type})", f"Error: {str(e)}, File: {filepath}")
        raise

def read_session_context(session_id: str) -> Dict[str, str]:
    config = ESSENTIAL_CONFIG_LOADED
    phalanx_root = config.get("phalanx_root")
    if not phalanx_root: return {}
    context_dir_config = config.get("directories", {}).get("context")
    if not context_dir_config: return {}
    context_dir = os.path.join(phalanx_root, context_dir_config)
    result = {}
    if not os.path.isdir(context_dir): return {}
    for context_type_slug in os.listdir(context_dir):
        if context_type_slug.startswith(f"{session_id}_") and context_type_slug.endswith(".txt"):
            actual_context_type = context_type_slug[len(session_id)+1:-4]
            filepath = os.path.join(context_dir, context_type_slug)
            try:
                with open(filepath, "r", encoding='utf-8') as f: result[actual_context_type] = f.read()
            except Exception as e:
                log_audit("CONTEXT_SYSTEM", "Context Read Error", f"File: {filepath}, Error: {str(e)}")
    return result

# --- Core Helper Functions ---
def write_safely(filepath, content):
    temp_path = f"{filepath}.tmp.{os.getpid()}"
    directory = os.path.dirname(filepath)
    try:
        if directory and not os.path.exists(directory):
            try: os.makedirs(directory, exist_ok=True)
            except OSError as e_mkdir: raise PhalanxError(f"Failed to create dir '{directory}'", context={"filepath": filepath, "error": str(e_mkdir)})
        if directory and not os.access(directory, os.W_OK):
            raise PhalanxError(f"No write permission for dir '{directory}'", context={"filepath": filepath, "directory": directory})
        with open(temp_path, "w", encoding='utf-8') as f: f.write(content)
        os.rename(temp_path, filepath)
    except PhalanxError: raise
    except Exception as e:
        if os.path.exists(temp_path):
            try: os.remove(temp_path)
            except Exception: pass # Ignore error removing temp file
        raise PhalanxError(f"Failed to write safely to '{filepath}'", context={"filepath": filepath, "original_error": str(e)})

def sanitize_content(text):
    if not isinstance(text, str): text = str(text)
    return escape(text)

def get_doc_dir(doc_type):
    config = ESSENTIAL_CONFIG_LOADED
    if "directories" not in config or not isinstance(config["directories"], dict):
        raise PhalanxError("Config error: ESSENTIAL_CONFIG['directories'] missing/invalid", context={"config_section": "directories"})
    if doc_type == "lesson":
        if "lessons" not in config["directories"]:
            raise PhalanxError(f"Dir for '{doc_type}' not configured", context={"doc_type": doc_type, "missing_key": "lessons"})
        return config["directories"]["lessons"]
    elif doc_type == "fmea_entry":
        return config["directories"].get("fmea_entries", config.get("phalanx_root")) # Ensure phalanx_root exists
    else:
        phalanx_root = config.get("phalanx_root")
        if not phalanx_root:
            raise PhalanxError(f"Default dir (phalanx_root) not configured for '{doc_type}'", context={"doc_type": doc_type, "missing_config": "phalanx_root"})
        return phalanx_root

def slugify(value, allow_unicode=False):
    value = str(value)
    if allow_unicode: value = unicodedata.normalize('NFKC', value)
    else: value = unicodedata.normalize('NFKD', value).encode('ascii', 'ignore').decode('ascii')
    value = re.sub(r'[^\w\s-]', '', value.lower())
    return re.sub(r'[-\s]+', '-', value).strip('-_')

def ensure_directories_exist(role_for_log="SYSTEM_SETUP"):
    config = ESSENTIAL_CONFIG_LOADED
    phalanx_root = config.get("phalanx_root")
    if phalanx_root and isinstance(phalanx_root, str):
        if not os.path.exists(phalanx_root):
            try: os.makedirs(phalanx_root, exist_ok=True)
            except OSError as e: raise PhalanxError(f"Could not create phalanx_root '{phalanx_root}'", context={"path": phalanx_root, "error": str(e)})
        elif not os.path.isdir(phalanx_root):
            raise PhalanxError(f"phalanx_root '{phalanx_root}' not a directory", context={"path": phalanx_root})
    
    configured_dirs = config.get("directories", {})
    if not isinstance(configured_dirs, dict):
        raise PhalanxError("ESSENTIAL_CONFIG['directories'] not a dict", context={"config_key": "directories"})

    all_created_or_exist = True
    for dir_key, dir_path_str in configured_dirs.items():
        if not isinstance(dir_path_str, str): continue # Skip non-string paths
        resolved_path = dir_path_str
        if not os.path.isabs(dir_path_str):
            if not phalanx_root: all_created_or_exist = False; continue
            resolved_path = os.path.join(phalanx_root, dir_path_str)
        resolved_path = os.path.normpath(resolved_path)
        if not os.path.exists(resolved_path):
            try: os.makedirs(resolved_path, exist_ok=True)
            except OSError: all_created_or_exist = False
        elif not os.path.isdir(resolved_path): all_created_or_exist = False
    
    audit_log_config = config.get("files", {}).get("audit_log")
    if audit_log_config and isinstance(audit_log_config, str):
        resolved_audit_log_path = audit_log_config
        if not os.path.isabs(audit_log_config) and phalanx_root:
            resolved_audit_log_path = os.path.join(phalanx_root, audit_log_config)
        audit_log_parent_dir = os.path.dirname(os.path.normpath(resolved_audit_log_path))
        if audit_log_parent_dir and not os.path.exists(audit_log_parent_dir):
            try: os.makedirs(audit_log_parent_dir, exist_ok=True)
            except OSError: all_created_or_exist = False
        elif audit_log_parent_dir and not os.path.isdir(audit_log_parent_dir): all_created_or_exist = False
        
    if not all_created_or_exist:
        raise PhalanxError("Failed to ensure all required directory structures.")
    return True

def handle_create_doc(args):
    config = ESSENTIAL_CONFIG_LOADED
    doc_type = args.type
    title = args.title
    sanitized_title = sanitize_content(title)
    context = {
        "title": sanitized_title, "date": datetime.datetime.now().strftime("%Y-%m-%d"),
        "role": args.role, "unique_id": str(uuid.uuid4()),
        "key_takeaway": sanitize_content(getattr(args, 'key_takeaway', "")),
        "details": sanitize_content(getattr(args, 'details', "")),
    }
    if doc_type == "fmea_entry":
        fmea_fields = ["risk_level", "related_component", "failure_mode", "effects", "severity", "causes", "occurrence", "controls", "detection", "rpn", "actions"]
        for field in fmea_fields: context[field] = sanitize_content(getattr(args, field, "" if field not in ["risk_level", "related_component"] else "Not specified"))
    
    template_string = config["doc_templates"].get(doc_type)
    if not template_string: raise PhalanxError(f"Doc type '{doc_type}' not in templates", context={"doc_type": doc_type})
    
    try: content = template_string.format_map(context)
    except KeyError as e: raise PhalanxError(f"Template for '{doc_type}' missing key '{e}'", context={"doc_type": doc_type, "key_error": str(e)})
    
    filename = f"{context['unique_id']}_{slugify(title)}.md"
    output_dir = get_doc_dir(doc_type)
    if not output_dir: raise PhalanxError(f"Output dir for '{doc_type}' is None", context={"doc_type": doc_type})
    output_path = os.path.join(output_dir, filename)
    
    write_safely(output_path, content)
    log_audit(args.role, "Created document", f"Type: {doc_type}, Title: '{title}', File: {output_path}")
    print(f"Document created successfully: {output_path}")

def log_structured_llm_consultation(args, raw_llm_json, raw_json_filename):
    config = ESSENTIAL_CONFIG_LOADED
    if not PerplexityCoTParser:
        raise PhalanxError("PerplexityCoTParser not available for structured logging.")

    parser = PerplexityCoTParser()
    parsed_result = parser.parse_response(raw_llm_json)
    if parsed_result.get("error"):
        raise PhalanxError("Failed to parse LLM response JSON.", context={"parser_error": parsed_result['error']})

    metadata = parsed_result.get("metadata", {})
    frontmatter = {
        "date": metadata.get("created", datetime.datetime.now().isoformat()), "role": args.role,
        "agent_profile_used": args.agent_profile, "model_name": metadata.get("model", "N/A"),
        "temperature": config["agent_profiles"][args.agent_profile].get("temperature", "N/A"),
        "max_tokens": config["agent_profiles"][args.agent_profile].get("max_tokens", "N/A"),
        "total_tokens": metadata.get("total_tokens", "null"), "unique_id": str(uuid.uuid4()),
        "query_summary_slug": slugify(args.query[:30]),
        "raw_json_log_file": os.path.basename(raw_json_filename) if raw_json_filename else "N/A"
    }
    yaml_frontmatter_str = "---\n" + "".join([f"{k}: \"{v}\"\n" if isinstance(v, str) else f"{k}: {v if v is not None else 'null'}\n" for k, v in frontmatter.items()]) + "---\n\n"
    
    md_body = f"# LLM Consultation & Analysis ({args.role} via {args.agent_profile})\n\n"
    md_body += f"## Original Query\n\n```text\n{sanitize_content(args.query)}\n```\n\n"
    # ... (rest of md_body construction for reasoning, answer, insights, code_snippets, citations)
    reasoning_data = parsed_result.get("reasoning", {})
    answer_data = parsed_result.get("answer", {})
    insights_list = parsed_result.get("insights", [])
    code_snippets_list = parsed_result.get("code_snippets", [])
    citations_list = parsed_result.get("citations", [])

    if reasoning_data.get("present") and reasoning_data.get("raw_text"):
        md_body += "## Extracted Reasoning/Thinking Steps\n\n```markdown\n" + sanitize_content(reasoning_data["raw_text"]) + "\n```\n\n"
    md_body += "## Full LLM Answer Text\n\n```markdown\n" + sanitize_content(answer_data.get("raw_text", "No answer text extracted.")) + "\n```\n\n"
    if insights_list:
        md_body += "## Key Insights Extracted\n\n" + "".join([f"- **Type:** {i.get('type','general')}\n  **Source:** {i.get('source','N/A')}\n  **Text:** {sanitize_content(i.get('text','N/A'))}\n\n" for i in insights_list])
    if code_snippets_list:
        md_body += "## Extracted Code Snippets\n\n" + "".join([f"### Snippet ID: {s.get('id','N/A')} (Language: {s.get('language','text')}, Hash: {s.get('hash','N/A')})\n```{s.get('language','text')}\n{s.get('code','No code')}\n```\n\n" for s in code_snippets_list])
    if citations_list:
        md_body += "## Extracted Citations\n\n" + "".join([f"- [{c.get('title','N/A')}]({c.get('url','#')}) (ID: {c.get('id','N/A')})\n" for c in citations_list]) + "\n"

    log_entry_content = yaml_frontmatter_str + md_body
    
    output_dir_str = config["directories"].get("llm_qa_logs")
    if not output_dir_str: raise PhalanxError("'llm_qa_logs' dir not configured", context={"missing_config_key": "directories.llm_qa_logs"})
    
    phalanx_root = config.get("phalanx_root")
    output_dir = os.path.join(phalanx_root, output_dir_str) if not os.path.isabs(output_dir_str) and phalanx_root else output_dir_str
    output_dir = os.path.normpath(output_dir)
    
    current_time_slug = datetime.datetime.fromisoformat(frontmatter["date"].split('.')[0]).strftime("%Y%m%d_%H%M%S") if isinstance(frontmatter["date"], str) else datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
    parsed_md_filename = f"llm_consult_parsed_{current_time_slug}_{frontmatter['query_summary_slug']}.md"
    output_path = os.path.join(output_dir, parsed_md_filename)
    
    write_safely(output_path, log_entry_content)
    log_audit(args.role, "Saved structured LLM log", f"File: {output_path}")
    print(f"Structured LLM consultation log saved successfully: {output_path}")

def send_to_perplexity(query_text, agent_profile_name):
    config = ESSENTIAL_CONFIG_LOADED
    api_key = os.environ.get("PERPLEXITY_API_KEY")
    key_source = "environment variable"
    if not api_key:
        mcp_json_path = os.path.join(".cursor", "mcp.json") 
        if os.path.exists(mcp_json_path):
            try:
                with open(mcp_json_path, "r") as f: mcp_config = json.load(f)
                api_key = mcp_config.get("mcoServers", {}).get("github.com/pashpashpash/perplexity-mcp", {}).get("env", {}).get("PERPLEXITY_API_KEY")
                if api_key: key_source = ".cursor/mcp.json"
            except Exception: pass # Ignore errors reading mcp.json
    if not api_key: raise PhalanxError("Perplexity API key not found", context={"detail": "PERPLEXITY_API_KEY not found"})
    
    agent_config = config["agent_profiles"].get(agent_profile_name)
    if not agent_config: raise PhalanxError(f"Agent profile '{agent_profile_name}' not found", context={"profile_name": agent_profile_name})

    headers = {"Authorization": f"Bearer {api_key}", "Content-Type": "application/json", "Accept": "application/json"}
    payload = {
        "model": agent_config.get("model"), "messages": [{"role": "system", "content": agent_config.get("system_prompt", "Be precise.")}, {"role": "user", "content": query_text}],
        "temperature": agent_config.get("temperature"), "max_tokens": agent_config.get("max_tokens"),
    }
    payload = {k: v for k, v in payload.items() if v is not None} # Remove None values
    
    api_url = "https://api.perplexity.ai/chat/completions"
    try:
        response = requests.post(api_url, headers=headers, json=payload, timeout=60)
        response.raise_for_status()
        return response.json()
    except requests.exceptions.HTTPError as e_http:
        raise PhalanxError(f"Perplexity API HTTP error {e_http.response.status_code}", context={"status": e_http.response.status_code, "text": e_http.response.text})
    except requests.exceptions.RequestException as e_req:
        raise PhalanxError("Perplexity API request error", context={"error": str(e_req)})
    except json.JSONDecodeError as e_json:
        raise PhalanxError("Failed to decode JSON from Perplexity API", context={"error": str(e_json), "response_text": response.text if 'response' in locals() else 'N/A'})

def send_to_perplexity_with_retry(query_text, agent_profile_name, max_retries=3, session_id=None):
    cached = get_cached_response(query_text, agent_profile_name)
    if cached: return cached
    
    final_query_text = query_text
    if session_id:
        session_contexts = read_session_context(session_id)
        context_str = session_contexts.get("llm_summary") or session_contexts.get("query_history")
        if context_str: final_query_text = f"Prior context:\n{context_str}\n\n---\nUser Query:\n{query_text}"

    last_error = None
    for attempt in range(max_retries):
        try:
            response_data = send_to_perplexity(final_query_text, agent_profile_name)
            cache_response(query_text, agent_profile_name, response_data)
            return response_data
        except PhalanxError as e:
            last_error = e
            error_str_lower = str(e).lower()
            context_str_lower = json.dumps(e.context).lower() if e.context else ""
            is_retryable = "timeout" in error_str_lower or "timeout" in context_str_lower or \
                           "connect" in error_str_lower or "connect" in context_str_lower or \
                           (e.context and e.context.get("status") in [500, 502, 503, 504]) # Common server-side retryable errors
            if is_retryable and attempt < max_retries - 1:
                wait_time = 2 ** (attempt + 1)
                log_audit("LLM_RETRY", f"Retry {attempt+1}/{max_retries}", f"Error: {str(e)[:100]}, Wait: {wait_time}s")
                time.sleep(wait_time)
            else: break # Non-retryable or last attempt
    if last_error: raise last_error
    raise PhalanxError("LLM call failed after retries, no specific error captured.", context={"query": query_text, "profile": agent_profile_name})


def handle_direct_consult_llm(args):
    log_audit(args.role, "Initiated direct LLM consultation", f"Profile: {args.agent_profile}, Query: '{args.query[:50]}...'")
    raw_llm_json_response = send_to_perplexity_with_retry(args.query, args.agent_profile, session_id=args.session_id)
    
    if raw_llm_json_response and raw_llm_json_response.get("choices") and raw_llm_json_response["choices"][0].get("message"):
        print("\n--- LLM Response ---\n" + raw_llm_json_response["choices"][0]["message"].get("content", "No content.") + "\n--------------------\n")
    
    config = ESSENTIAL_CONFIG_LOADED
    output_dir_str = config["directories"].get("llm_qa_logs")
    raw_json_filename = None
    if output_dir_str:
        phalanx_root = config.get("phalanx_root")
        output_dir = os.path.join(phalanx_root, output_dir_str) if not os.path.isabs(output_dir_str) and phalanx_root else output_dir_str
        timestamp_slug = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
        query_slug = slugify(args.query[:30])
        raw_json_filename = f"mcp_raw_{timestamp_slug}_{query_slug}.json"
        raw_json_output_path = os.path.join(os.path.normpath(output_dir), raw_json_filename)
        try:
            write_safely(raw_json_output_path, json.dumps(raw_llm_json_response, indent=2))
            log_audit(args.role, "Saved raw LLM JSON", f"File: {raw_json_output_path}")
        except Exception as e_write_raw:
            log_audit(args.role, "LLM Consult Error", f"Failed to save raw LLM JSON: {e_write_raw}")
            raw_json_filename = None # Ensure it's None if save failed
    
    if PerplexityCoTParser: # Check if parser is available before calling
        log_structured_llm_consultation(args, raw_llm_json=raw_llm_json_response, raw_json_filename=raw_json_filename)
    else:
        log_audit(args.role, "LLM Structured Log Skipped", "PerplexityCoTParser not available.")


def handle_validate_workspace(args):
    # Simplified implementation to avoid further errors, assumes ESSENTIAL_CONFIG_LOADED
    config = ESSENTIAL_CONFIG_LOADED
    print("\n--- Validating Workspace (Simplified) ---")
    phalanx_root_path = config.get('phalanx_root') # Get path once
    if not phalanx_root_path or not os.path.isdir(phalanx_root_path):
        print(f"ERROR: phalanx_root '{phalanx_root_path}' is not a valid directory.", file=sys.stderr)
        return False
    # Add more checks as needed from the original function
    print("--- Workspace Validation (Simplified) Successful ---")
    return True


def handle_create_episode(args):
    config = ESSENTIAL_CONFIG_LOADED
    if not Episode or not SimpleVectorStore:
        raise PhalanxError("Episodic memory system not loaded.")
    
    episode_data = {k: getattr(args, k) for k in ["role", "task", "context", "reasoning", "action", "outcome"] if hasattr(args, k)}
    episode_data["session_id"] = getattr(args, 'session_id', str(uuid.uuid4())[:8])
    for k_list in ["next_steps", "open_questions", "tags", "components"]:
        episode_data[k_list] = getattr(args, k_list, "").split(',') if getattr(args, k_list, "") else []
    episode_data["llm_consultation_log_file"] = getattr(args, "llm_log_file", "") or ""
    
    try: episode = Episode(**episode_data)
    except ValidationError as ve: raise PhalanxError("Episode data validation failed.", context={"errors": json.loads(ve.json())})
    
    storage_dir_path = config.get("directories", {}).get("episodes_db", "PHALANX/memory_db") # Default if not in config
    phalanx_root = config.get("phalanx_root")
    if not os.path.isabs(storage_dir_path) and phalanx_root:
        storage_dir_path = os.path.join(phalanx_root, storage_dir_path)
    storage_dir_path = os.path.normpath(storage_dir_path)
    
    store = SimpleVectorStore(storage_dir=storage_dir_path)
    episode_id = store.add(episode)
    if "ERROR_" in episode_id: raise PhalanxError(f"Failed to add episode: {episode_id}")
    log_audit(args.role, "Created Memory Episode", f"ID: {episode_id}, Task: {args.task[:50]}...")
    print(f"Memory episode '{episode_id}' stored successfully in {storage_dir_path}.")


def handle_recall_episodes(args):
    config = ESSENTIAL_CONFIG_LOADED
    if not Episode or not SimpleVectorStore:
        raise PhalanxError("Episodic memory system not loaded.")

    query = args.query
    if not query and not args.list_all:
        # Non-interactive assumption for now
        print("No query provided. Use --query or --list-all.", file=sys.stderr)
        return

    storage_dir_path = config.get("directories", {}).get("episodes_db", "PHALANX/memory_db")
    phalanx_root = config.get("phalanx_root")
    if not os.path.isabs(storage_dir_path) and phalanx_root:
        storage_dir_path = os.path.join(phalanx_root, storage_dir_path)
    storage_dir_path = os.path.normpath(storage_dir_path)

    store = SimpleVectorStore(storage_dir=storage_dir_path)
    results = []
    if args.list_all:
        results = [(1.0, store.episodes[ep_id]) for ep_id in store.ids]
    elif query:
        results = store.search(query, top_k=args.limit, similarity_threshold=args.threshold)

    if not results:
        print("No relevant episodes found.")
        log_audit(args.role, "Recall Episodes", f"No results for query: '{query if query else '(list_all)'}'")
        return

    print(f"\nFound {len(results)} relevant episode(s):")
    for i, (similarity, episode_dict) in enumerate(results, 1):
        print(f"\n--- Episode {i} (ID: {episode_dict['id']}) ---")
        if query and not args.list_all: print(f"  Relevance: {similarity:.4f}")
        # Simplified output
        print(f"  Task: {episode_dict.get('task')}")
        print(f"  Outcome: {episode_dict.get('outcome')}")

    if args.generate_handoff:
        generate_handoff_from_episodes(results, args.role, args.session_id)


def generate_handoff_from_episodes(recalled_episodes: List[Tuple[float, Dict]], role: str, session_id: str):
    config = ESSENTIAL_CONFIG_LOADED
    if not recalled_episodes: return
    episodes = [ep_dict for _, ep_dict in recalled_episodes]
    
    handoff_dir_str = config.get("directories", {}).get("handoffs", "PHALANX/handoffs")
    phalanx_root = config.get("phalanx_root")
    handoff_dir = os.path.join(phalanx_root, handoff_dir_str) if not os.path.isabs(handoff_dir_str) and phalanx_root else handoff_dir_str
    handoff_dir = os.path.normpath(handoff_dir)
    
    timestamp_str = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
    handoff_filename = f"handoff_{role}_{session_id}_{timestamp_str}.md"
    handoff_filepath = os.path.join(handoff_dir, handoff_filename)

    # Simplified content generation
    content = f"# PHALANX Handoff Document for {role} (Session: {session_id})\n"
    content += f"Generated: {datetime.datetime.now().isoformat()}\n"
    content += f"Based on {len(episodes)} recalled episode(s).\n\n"
    for ep in episodes:
        content += f"## Episode ID: {ep.get('id')}\n"
        content += f"- Task: {ep.get('task', 'N/A')}\n"
        content += f"- Outcome: {ep.get('outcome', 'N/A')}\n\n"
    
    write_safely(handoff_filepath, content)
    print(f"Handoff document generated: {handoff_filepath}")
    log_audit(role, "Handoff Generated", f"File: {handoff_filepath}")


# This is the main function for direct script execution, using the Zsh-aware parser
def main():
    """Main function to parse arguments and dispatch commands."""
    current_session_id = str(uuid.uuid4())[:8] # For session tracking

    # Use the PhalanxZshAwareArgumentParser
    parser = PhalanxZshAwareArgumentParser(description="PHALANX CLI Tool - Adherence to the PHALANX doctrine.")
    parser.add_argument("--role", required=True, choices=ESSENTIAL_CONFIG_LOADED.get("roles", ["default_role"]), 
                        help="The role of the user invoking the command.")

    subparsers = parser.add_subparsers(title="commands", dest="command", required=True,
                                     help="Available PHALANX commands. Use 'phalanx.py <command> --help' for details on each command.")

    # --- create_doc command ---
    create_doc_parser = subparsers.add_parser("create_doc", help="Create a new document from a template.")
    create_doc_parser.add_argument("--type", required=True, choices=list(ESSENTIAL_CONFIG_LOADED.get("doc_templates", {}).keys()),
                                   help="Type of document to create (must be defined in doc_templates config).")
    create_doc_parser.add_argument("--title", required=True, help="Title of the new document.")
    create_doc_parser.add_argument("--key_takeaway", help="Key takeaway for lesson documents.")
    create_doc_parser.add_argument("--details", help="Detailed content for lesson documents.")
    # FMEA specific arguments
    fmea_args = ["risk_level", "related_component", "failure_mode", "effects", "severity", "causes", "occurrence", "controls", "detection", "rpn", "actions"]
    for arg_name in fmea_args: create_doc_parser.add_argument(f"--{arg_name}", help=f"{arg_name.replace('_', ' ').title()} (for FMEA).")
    create_doc_parser.set_defaults(func=handle_create_doc)

    # --- consult_llm command ---
    consult_llm_parser = subparsers.add_parser("consult_llm", help="Consult an LLM agent and log the interaction.")
    consult_llm_parser.add_argument("--query", required=True, help="The query/prompt to send to the LLM.")
    consult_llm_parser.add_argument("--agent_profile", default="planner",
                                    choices=list(ESSENTIAL_CONFIG_LOADED.get("agent_profiles", {}).keys()),
                                    help="The agent profile to use for the LLM consultation.")
    consult_llm_parser.set_defaults(func=handle_direct_consult_llm)

    # --- validate_workspace command ---
    validate_ws_parser = subparsers.add_parser("validate_workspace", help="Validate workspace setup and permissions.")
    validate_ws_parser.set_defaults(func=handle_validate_workspace)

    # --- create_episode command ---
    episode_parser = subparsers.add_parser('create_episode', help='Create and store a memory episode.')
    ep_args = ["task", "context", "reasoning", "action", "outcome"]
    for arg_name in ep_args: episode_parser.add_argument(f'--{arg_name}', required=True, help=f'{arg_name.replace("_"," ").title()}')
    ep_opt_args = ["next_steps", "open_questions", "tags", "components", "llm_log_file"]
    for arg_name in ep_opt_args: episode_parser.add_argument(f'--{arg_name}', help=f'{arg_name.replace("_"," ").title()} (optional, comma-separated for lists)')
    episode_parser.set_defaults(func=handle_create_episode)
    
    # --- recall command ---
    recall_parser = subparsers.add_parser('recall', help='Recall and search episodes from memory.')
    recall_parser.add_argument('--query', '-q', help='Search query for episodic memory.')
    recall_parser.add_argument('--limit', '-l', type=int, default=3, help='Max episodes (default: 3).')
    recall_parser.add_argument('--threshold', '-t', type=float, default=0.3, help='Min similarity (default: 0.3).')
    recall_parser.add_argument('--list-all', action='store_true', help='List all episodes.')
    recall_parser.add_argument('--verbose', '-v', action='store_true', help='Verbose output.')
    recall_parser.add_argument('--generate-handoff', action='store_true', help='Generate handoff doc.')
    recall_parser.set_defaults(func=handle_recall_episodes)

    try:
        args = parser.parse_args()
        args.session_id = current_session_id # Add session ID to args
        
        # Basic check if ESSENTIAL_CONFIG_LOADED is populated
        if not ESSENTIAL_CONFIG_LOADED or not ESSENTIAL_CONFIG_LOADED.get("phalanx_root"):
             print("CRITICAL: PHALANX Core Configuration not loaded. Cannot proceed.", file=sys.stderr)
             sys.exit(1)

        validate_config() # Validates ESSENTIAL_CONFIG_LOADED
        
        if not ensure_directories_exist(args.role if hasattr(args, 'role') else "SYSTEM_SETUP"):
            print("CRITICAL: Failed to ensure required directory structure. Aborting.", file=sys.stderr)
            sys.exit(1)

        if hasattr(args, 'func'):
            args.func(args)
        else:
            parser.print_help()

    except PhalanxError as pe:
        print(f"PHALANX ERROR: {pe}", file=sys.stderr)
        if pe.context: print(f"Context: {json.dumps(pe.context)}", file=sys.stderr)
        sys.exit(1)
    except Exception as e:
        print(f"An UNEXPECTED error occurred in PHALANX: {type(e).__name__} - {e}", file=sys.stderr)
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == "__main__":
    # Ensure PHALANX_INVOCATION_CWD is set correctly if phalanx.py is the entry point
    # This might be redundant if already set by the modernization block, but ensures it for direct execution.
    _phalanx_py_dir_main = os.path.dirname(os.path.abspath(__file__))
    if "PHALANX_INVOCATION_CWD" not in os.environ:
         os.environ["PHALANX_INVOCATION_CWD"] = _phalanx_py_dir_main
         print(f"INFO (main block): PHALANX_INVOCATION_CWD auto-set to project root: {_phalanx_py_dir_main}", flush=True)
    
    # Call the new CLI entry point from the phalanx package
    # This ensures that the argument parsing defined in phalanx.cli.main and its submodules is used.
    phalanx_cli_main() 