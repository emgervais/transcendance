#!/usr/bin/python3
import os
import re
from pathlib import Path

class TokenNotFound(Exception):
    pass

class TemplateNameNotFound(Exception):
    pass

TEMPLATES_ROOT = os.path.join(Path(__file__).resolve(), "templates")
INDEX = "base.html"

# -- util ----
def str_find(txt, strs):
    positions = []
    for s in strs:
        positions.append(txt.find(s))
    positions = filter(lambda i: i != -1, positions)
    try:
        res = min(positions)
    except ValueError:
        res = -1
    return res
    
# -- strip ----
def remove_comments(html):
    comment = r'<!--((.|\r\n|\r|\n)*?)-->'
    res = re.sub(comment, '', html)
    return res

def minify(html):
    white_space = r'(?<=>)\s+(?=<)'
    res = re.sub(white_space, '', html)
    res = res.replace('\n', '')
    return res

# -- main ----
def get_token(html, pattern):
    res = re.search(pattern, html)
    if not res:
        raise TokenNotFound
    pos = res.start()
    end = res.end()
    token = html[pos:end]
    return token, pos, end

def get_template_name(token):
    pos = 0
    _pos = token.find("include")
    if _pos == -1:
        raise TemplateNameNotFound
    pos += _pos + 7
    _pos  = str_find(token[pos:], ["'", "\""])
    if _pos == -1:
        raise TemplateNameNotFound
    pos += _pos + 1
    size = str_find(token[pos:], ["'", "\""])
    if size == -1:
        raise TemplateNameNotFound
    name = token[pos:pos+size]
    return name

def include_templates(root, html):
    while True:
        try:
            token, pos, end = get_token(html, r'{%.*%}')
        except TokenNotFound:
            break
        try:
            template_name = get_template_name(token)
            content = compile(root, template_name)
        except TemplateNameNotFound:
            content = ""
        html = html[:pos] + content + html[end:]
    return html

def compile(root, template):
    path = os.path.join(root, template)
    html = ""
    with open(path, 'r', encoding='utf8') as template:
        html += template.read()
        html = remove_comments(html)
        html = include_templates(root, html)
    html = minify(html)
    return html

if __name__ == "__main__":
    html = compile(TEMPLATES_ROOT, INDEX)
    print(html)