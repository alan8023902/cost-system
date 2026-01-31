#!/usr/bin/env python3
"""
Cost Skills MCP Server
Provides access to cost system skills and documentation.
"""

import asyncio
import json
import os
import sys
from pathlib import Path
from typing import Any, Dict, List, Optional

def _skills_root() -> Path:
    """
    Resolve the skills root folder.
    Priority:
      1) env COST_SKILLS_ROOT
      2) repo-relative: ./skills
    """
    env_root = os.getenv("COST_SKILLS_ROOT")
    if env_root:
        return Path(env_root).expanduser().resolve()
    return Path.cwd().joinpath("skills").resolve()


def _read_text(p: Path) -> str:
    return p.read_text(encoding="utf-8")


def _find_skill_dirs(root: Path) -> List[Path]:
    """
    A 'skill directory' is one that contains a SKILL.md file.
    Example:
      skills/cost-system-java/SKILL.md
    """
    if not root.exists():
        return []
    skill_dirs: List[Path] = []
    for path in root.rglob("SKILL.md"):
        if path.is_file():
            skill_dirs.append(path.parent)
    return sorted(skill_dirs, key=lambda x: str(x))


def _skill_name_from_dir(skill_dir: Path) -> str:
    return skill_dir.name


def _skill_file(skill_dir: Path) -> Path:
    return skill_dir.joinpath("SKILL.md")


def list_skills() -> Dict[str, Any]:
    """
    List available skills discovered under skills root.
    Returns:
      {
        "skills": [
           {"name": "cost-system-java", "path": "skills/cost-system-java"},
           ...
        ]
      }
    """
    root = _skills_root()
    dirs = _find_skill_dirs(root)
    items = []
    for d in dirs:
        items.append(
            {
                "name": _skill_name_from_dir(d),
                "path": str(d.relative_to(Path.cwd())) if d.is_relative_to(Path.cwd()) else str(d),
            }
        )
    return {"skills": items, "root": str(root)}


def get_skill(name: str) -> Dict[str, Any]:
    """
    Get the full SKILL.md content by skill directory name.
    Example input:
      {"name": "cost-system-java"}
    Output:
      {"name": "...", "content": "...", "path": "..."}
    """
    root = _skills_root()
    target_dir = root.joinpath(name)
    skill_md = _skill_file(target_dir)

    if not skill_md.exists():
        # Fall back to search by scanning
        for d in _find_skill_dirs(root):
            if _skill_name_from_dir(d) == name:
                target_dir = d
                skill_md = _skill_file(d)
                break

    if not skill_md.exists():
        return {
            "error": "SKILL_NOT_FOUND",
            "message": f"Skill '{name}' not found under {root}. Expected: {skill_md}",
        }

    return {
        "name": name,
        "path": str(target_dir),
        "content": _read_text(skill_md),
    }


def search_skills(query: str, limit: int = 10) -> Dict[str, Any]:
    """
    Simple full-text search across SKILL.md files.
    Returns matches with name + short snippet.
    """
    root = _skills_root()
    results = []
    q = query.lower().strip()
    if not q:
        return {"results": []}

    for d in _find_skill_dirs(root):
        md = _skill_file(d)
        text = _read_text(md)
        lower = text.lower()
        idx = lower.find(q)
        if idx >= 0:
            start = max(0, idx - 80)
            end = min(len(text), idx + 200)
            snippet = text[start:end].replace("\n", " ")
            results.append(
                {
                    "name": _skill_name_from_dir(d),
                    "path": str(d),
                    "snippet": snippet,
                }
            )
            if len(results) >= limit:
                break

    return {"results": results, "root": str(root)}


# Tool registry
TOOLS = {
    "list_skills": {
        "function": list_skills,
        "description": "List available skills discovered under skills root",
        "inputSchema": {
            "type": "object",
            "properties": {},
            "required": []
        }
    },
    "get_skill": {
        "function": get_skill,
        "description": "Get the full SKILL.md content by skill directory name",
        "inputSchema": {
            "type": "object",
            "properties": {
                "name": {
                    "type": "string",
                    "description": "The skill name to retrieve"
                }
            },
            "required": ["name"]
        }
    },
    "search_skills": {
        "function": search_skills,
        "description": "Simple full-text search across SKILL.md files",
        "inputSchema": {
            "type": "object",
            "properties": {
                "query": {
                    "type": "string",
                    "description": "Search query"
                },
                "limit": {
                    "type": "integer",
                    "description": "Maximum number of results",
                    "default": 10
                }
            },
            "required": ["query"]
        }
    }
}


def handle_request(request: Dict[str, Any]) -> Dict[str, Any]:
    """Handle MCP request and return response"""
    method = request.get("method")
    request_id = request.get("id")
    
    if method == "initialize":
        return {
            "jsonrpc": "2.0",
            "id": request_id,
            "result": {
                "protocolVersion": "2024-11-05",
                "capabilities": {
                    "tools": {}
                },
                "serverInfo": {
                    "name": "cost-skills-server",
                    "version": "1.0.0"
                }
            }
        }
    
    elif method == "tools/list":
        tools_list = []
        for name, tool_info in TOOLS.items():
            tools_list.append({
                "name": name,
                "description": tool_info["description"],
                "inputSchema": tool_info["inputSchema"]
            })
        
        return {
            "jsonrpc": "2.0",
            "id": request_id,
            "result": {
                "tools": tools_list
            }
        }
    
    elif method == "tools/call":
        params = request.get("params", {})
        tool_name = params.get("name")
        arguments = params.get("arguments", {})
        
        if tool_name not in TOOLS:
            return {
                "jsonrpc": "2.0",
                "id": request_id,
                "error": {
                    "code": -32601,
                    "message": f"Tool '{tool_name}' not found"
                }
            }
        
        try:
            tool_func = TOOLS[tool_name]["function"]
            result = tool_func(**arguments)
            
            return {
                "jsonrpc": "2.0",
                "id": request_id,
                "result": {
                    "content": [
                        {
                            "type": "text",
                            "text": json.dumps(result, ensure_ascii=False, indent=2)
                        }
                    ]
                }
            }
        except Exception as e:
            return {
                "jsonrpc": "2.0",
                "id": request_id,
                "error": {
                    "code": -32603,
                    "message": f"Internal error: {str(e)}"
                }
            }
    
    else:
        return {
            "jsonrpc": "2.0",
            "id": request_id,
            "error": {
                "code": -32601,
                "message": f"Method '{method}' not found"
            }
        }


def main():
    """Main server loop"""
    try:
        for line in sys.stdin:
            line = line.strip()
            if not line:
                continue
            
            try:
                request = json.loads(line)
                response = handle_request(request)
                print(json.dumps(response, ensure_ascii=False), flush=True)
            except json.JSONDecodeError as e:
                error_response = {
                    "jsonrpc": "2.0",
                    "id": None,
                    "error": {
                        "code": -32700,
                        "message": f"Parse error: {str(e)}"
                    }
                }
                print(json.dumps(error_response, ensure_ascii=False), flush=True)
            except Exception as e:
                error_response = {
                    "jsonrpc": "2.0",
                    "id": None,
                    "error": {
                        "code": -32603,
                        "message": f"Internal error: {str(e)}"
                    }
                }
                print(json.dumps(error_response, ensure_ascii=False), flush=True)
    
    except KeyboardInterrupt:
        pass


if __name__ == "__main__":
    main()