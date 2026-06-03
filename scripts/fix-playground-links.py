#!/usr/bin/env python3
"""Remove existing PlaygroundLinks, re-add them from code blocks."""

import os
import re
import sys

DOCS_DIR = os.path.join(os.path.dirname(__file__), '..', 'docs')


def escape_for_attr(code: str) -> str:
    code = code.replace('&', '&amp;')
    code = code.replace('"', '&quot;')
    return code


def strip_html_comments(code: str) -> str:
    """Remove HTML comments that break Vue's template compiler."""
    return re.sub(r'<!--.*?-->', '', code, flags=re.DOTALL)


def collapse_blank_lines(code: str) -> str:
    lines = code.split('\n')
    result = []
    prev_blank = False
    for line in lines:
        if line.strip() == '':
            prev_blank = True
        else:
            if prev_blank and result:
                result.append('&#10;' + line)
            else:
                result.append(line)
            prev_blank = False
    return '\n'.join(result)


def make_playground_tag(code: str) -> str:
    clean = strip_html_comments(code)
    escaped = escape_for_attr(clean)
    collapsed = collapse_blank_lines(escaped)
    return f'<PlaygroundLink code="{collapsed}" />'


def strip_playground_links(lines: list[str]) -> list[str]:
    result = []
    i = 0
    while i < len(lines):
        line = lines[i]

        if line.strip().startswith('<PlaygroundLink'):
            while i < len(lines) and not lines[i].rstrip().endswith('" />'):
                i += 1
            i += 1
            if i < len(lines) and lines[i].strip() == '':
                i += 1
            continue

        result.append(line)
        i += 1

    return result


def strip_orphan_lines(lines: list[str]) -> list[str]:
    """Remove leftover lines from a previous buggy script run.

    Lines containing &quot; or starting with &#10; outside code blocks
    and PlaygroundLink tags are always orphans.
    """
    result = []
    in_code = False
    in_playground = False

    for line in lines:
        stripped = line.strip()

        if stripped.startswith('```'):
            in_code = not in_code
            result.append(line)
            continue

        if in_code:
            result.append(line)
            continue

        if stripped.startswith('<PlaygroundLink'):
            in_playground = True
            result.append(line)
            if stripped.endswith('" />'):
                in_playground = False
            continue

        if in_playground:
            result.append(line)
            if stripped.endswith('" />'):
                in_playground = False
            continue

        if '&quot;' in stripped or stripped.startswith('&#10;'):
            continue

        if stripped.endswith('" />') and not stripped.startswith('<PlaygroundLink'):
            if stripped.startswith('</') or stripped == '" />':
                continue

        result.append(line)

    return result


def process_file(filepath: str, dry_run: bool = False) -> int:
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    lines = content.split('\n')
    lines = strip_playground_links(lines)
    lines = strip_orphan_lines(lines)

    new_lines = []
    i = 0
    added = 0

    while i < len(lines):
        line = lines[i]

        if re.match(r'^```vue\b', line):
            new_lines.append(line)
            i += 1
            code_lines = []
            while i < len(lines) and lines[i] != '```':
                code_lines.append(lines[i])
                i += 1

            code = '\n'.join(code_lines)
            new_lines.extend(code_lines)

            if i < len(lines):
                new_lines.append(lines[i])
                i += 1

            tag = make_playground_tag(code)
            new_lines.append('')
            new_lines.append(tag)
            added += 1
        else:
            new_lines.append(line)
            i += 1

    if added > 0 and not dry_run:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write('\n'.join(new_lines))

    return added


def main():
    dry_run = '--dry-run' in sys.argv
    total = 0

    for subdir in ['q', os.path.join('es', 'q')]:
        dirpath = os.path.join(DOCS_DIR, subdir)
        if not os.path.isdir(dirpath):
            continue

        for filename in sorted(os.listdir(dirpath)):
            if not filename.endswith('.md'):
                continue
            if filename.startswith('nuxt-'):
                continue

            filepath = os.path.join(dirpath, filename)
            added = process_file(filepath, dry_run)
            if added > 0:
                label = '(dry run) ' if dry_run else ''
                print(f'{label}{subdir}/{filename}: {added} playground links')
                total += added

    print(f'\nTotal: {total} playground links {"would be " if dry_run else ""}regenerated')


if __name__ == '__main__':
    main()
