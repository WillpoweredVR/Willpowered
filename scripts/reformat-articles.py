#!/usr/bin/env python3
"""
Article Reformatter - Joanna Wiebe Copy Hackers Style
=====================================================

This script reformats all markdown articles to improve readability:
1. Breaks long paragraphs into 1-2 sentence chunks
2. Reduces bold overuse (max 1 key phrase per section)
3. Adds horizontal rules between major sections
4. Improves list spacing
5. Cleans up excessive whitespace

Usage:
    python scripts/reformat-articles.py [--dry-run] [--single FILE]

Options:
    --dry-run       Preview changes without writing files
    --single FILE   Process only one file (for testing)
    --backup        Create .bak files before modifying
"""

import os
import re
import sys
import argparse
from pathlib import Path
from typing import List, Tuple
import shutil

# Configuration
ARTICLES_DIR = "content/articles"
MAX_PARAGRAPH_SENTENCES = 2
MAX_BOLD_PER_SECTION = 1


def is_inside_formatting(text: str, pos: int) -> bool:
    """Check if position is inside **bold** or _italic_ formatting."""
    # Count formatting markers before this position
    before = text[:pos]
    
    # Check bold (**)
    bold_count = len(re.findall(r'\*\*', before))
    if bold_count % 2 == 1:  # Inside bold
        return True
    
    # Check italic (_) - but not in URLs
    # Remove URLs first to avoid false positives
    before_no_urls = re.sub(r'\[[^\]]+\]\([^)]+\)', '', before)
    italic_underscores = len(re.findall(r'(?<![a-zA-Z])_(?![a-zA-Z_])|(?<![a-zA-Z_])_(?![a-zA-Z])', before_no_urls))
    if italic_underscores % 2 == 1:
        return True
    
    return False


def split_into_sentences(text: str) -> List[str]:
    """Split text into sentences, being careful with abbreviations and formatting."""
    
    # If the paragraph has complex formatting, be more conservative
    has_bold = '**' in text
    has_italic = re.search(r'(?<!\*)\*(?!\*)|_[^_]+_', text)
    
    # Common abbreviations to protect
    abbreviations = ['Dr', 'Mr', 'Mrs', 'Ms', 'Prof', 'Sr', 'Jr', 'vs', 'etc', 'i.e', 'e.g', 'St', 'Mt', 'Inc', 'Ltd', 'Corp']
    
    # Protect abbreviations
    protected = text
    for abbr in abbreviations:
        protected = re.sub(rf'\b{abbr}\.', f'{abbr}〈DOT〉', protected, flags=re.IGNORECASE)
    
    # Protect decimal numbers
    protected = re.sub(r'(\d)\.(\d)', r'\1〈DOT〉\2', protected)
    
    # Find all sentence-ending positions
    sentence_ends = []
    for match in re.finditer(r'[.!?](?:\s+|$)', protected):
        pos = match.start()
        # Check if next char after punctuation+space is uppercase (new sentence)
        after = protected[match.end():]
        quote_chars = '"\'""\u201c\u201d\u2018\u2019'
        if after and (after[0].isupper() or after[0] in quote_chars):
            # Make sure we're not inside formatting
            if not is_inside_formatting(protected, pos):
                sentence_ends.append(match.end())
    
    # Split at sentence boundaries
    sentences = []
    last_pos = 0
    for end_pos in sentence_ends:
        sentence = protected[last_pos:end_pos].strip()
        if sentence:
            # Restore protected chars
            sentence = sentence.replace('〈DOT〉', '.')
            sentences.append(sentence)
        last_pos = end_pos
    
    # Don't forget the last part
    remaining = protected[last_pos:].strip()
    if remaining:
        remaining = remaining.replace('〈DOT〉', '.')
        sentences.append(remaining)
    
    return sentences if sentences else [text]


def count_words(text: str) -> int:
    """Count words in text, excluding markdown syntax."""
    clean = re.sub(r'\[([^\]]+)\]\([^)]+\)', r'\1', text)
    clean = re.sub(r'!\[[^\]]*\]\([^)]+\)', '', clean)
    clean = re.sub(r'[*_#>`]', '', clean)
    return len(clean.split())


def should_skip_paragraph(para: str) -> bool:
    """Check if paragraph should not be reformatted."""
    para = para.strip()
    if not para:
        return True
    if para.startswith('#'):
        return True
    if para.startswith('>'):
        return True
    if para.startswith('!['):
        return True
    if para.startswith('```'):
        return True
    if para.startswith('|'):
        return True
    if para.startswith('<'):
        return True
    if para.strip() in ['---', '***', '___']:
        return True
    if re.match(r'^[-*]\s', para) or re.match(r'^\d+\.\s', para):
        return True
    if re.match(r'^\[[^\]]+\]:', para):
        return True
    # Skip if it's entirely a formatted block (starts and ends with ** or _)
    if (para.startswith('**') and para.endswith('**')) or \
       (para.startswith('_') and para.endswith('_') and para.count('_') == 2):
        return True
    
    return False


def reformat_paragraph(para: str) -> str:
    """Break a long paragraph into shorter chunks."""
    if should_skip_paragraph(para):
        return para
    
    sentences = split_into_sentences(para)
    
    # If 2 or fewer sentences, leave it alone
    if len(sentences) <= MAX_PARAGRAPH_SENTENCES:
        return para
    
    # Group sentences into chunks of 1-2
    chunks = []
    i = 0
    while i < len(sentences):
        sentence = sentences[i]
        word_count = count_words(sentence)
        
        # Very short sentence? Consider combining with next
        if word_count < 12 and i + 1 < len(sentences):
            next_sentence = sentences[i + 1]
            combined_words = word_count + count_words(next_sentence)
            # Only combine if result isn't too long
            if combined_words < 35:
                chunks.append(sentence + ' ' + next_sentence)
                i += 2
                continue
        
        chunks.append(sentence)
        i += 1
    
    return '\n\n'.join(chunks)


def reduce_bold_overuse(content: str) -> str:
    """Reduce bold to max 1 key phrase per section."""
    lines = content.split('\n')
    result_lines = []
    current_section_lines = []
    
    def process_section(section_lines):
        """Process a section to reduce bold overuse."""
        section_text = '\n'.join(section_lines)
        
        # Find all bold phrases (complete ones only)
        bold_pattern = r'\*\*([^*\n]+)\*\*'
        matches = list(re.finditer(bold_pattern, section_text))
        
        if len(matches) <= MAX_BOLD_PER_SECTION:
            return section_lines
        
        # Score each bold phrase to find the most important one
        def score_bold(match):
            text = match.group(1)
            words = len(text.split())
            verbs = ['is', 'are', 'was', 'were', 'will', 'can', 'must', 'need', 'have', 'has', 'do', 'does', 'led', 'became', 'started', 'changed']
            has_verb = any(f' {v} ' in f' {text.lower()} ' for v in verbs)
            position = match.start() / len(section_text) if section_text else 0
            return words * (1.5 if has_verb else 1.0) * (0.5 + position)
        
        scored = [(m, score_bold(m)) for m in matches]
        scored.sort(key=lambda x: x[1], reverse=True)
        
        # Keep top one, unbold the rest
        modified = section_text
        for match, _ in scored[1:]:
            original = match.group(0)
            replacement = match.group(1)
            modified = modified.replace(original, replacement, 1)
        
        return modified.split('\n')
    
    for line in lines:
        if line.startswith('## ') and not line.startswith('### '):
            if current_section_lines:
                result_lines.extend(process_section(current_section_lines))
            current_section_lines = [line]
        else:
            current_section_lines.append(line)
    
    if current_section_lines:
        result_lines.extend(process_section(current_section_lines))
    
    return '\n'.join(result_lines)


def add_section_spacing(content: str) -> str:
    """Add horizontal rules between major sections for visual breaks."""
    lines = content.split('\n')
    result = []
    found_first_h2 = False
    prev_was_blank = False
    prev_was_hr = False
    
    for i, line in enumerate(lines):
        stripped = line.strip()
        
        if stripped.startswith('## ') and not stripped.startswith('### '):
            if found_first_h2 and not prev_was_hr:
                if not prev_was_blank:
                    result.append('')
                result.append('---')
                result.append('')
            found_first_h2 = True
        
        result.append(line)
        prev_was_blank = stripped == ''
        prev_was_hr = stripped == '---'
    
    return '\n'.join(result)


def improve_list_spacing(content: str) -> str:
    """Add breathing room around lists."""
    lines = content.split('\n')
    result = []
    in_list = False
    
    for i, line in enumerate(lines):
        stripped = line.strip()
        is_list_item = bool(re.match(r'^[-*]\s|^\d+\.\s|^\\-\s', stripped))
        
        if is_list_item and not in_list:
            if result and result[-1].strip() != '':
                result.append('')
            in_list = True
        elif not is_list_item and in_list and stripped != '':
            if result and result[-1].strip() != '':
                result.append('')
            in_list = False
        
        result.append(line)
    
    return '\n'.join(result)


def clean_excessive_newlines(content: str) -> str:
    """Remove more than 2 consecutive blank lines."""
    return re.sub(r'\n{3,}', '\n\n', content)


def parse_frontmatter(content: str) -> Tuple[str, str]:
    """Separate frontmatter from content."""
    if content.startswith('---'):
        end_match = re.search(r'\n---\n', content[3:])
        if end_match:
            end_pos = end_match.end() + 3
            frontmatter = content[:end_pos]
            body = content[end_pos:]
            return frontmatter, body
    return '', content


def reformat_article(content: str) -> str:
    """Apply all reformatting rules to an article."""
    frontmatter, body = parse_frontmatter(content)
    
    # Split into paragraphs
    paragraphs = []
    current_para = []
    in_code_block = False
    
    for line in body.split('\n'):
        if line.strip().startswith('```'):
            in_code_block = not in_code_block
            current_para.append(line)
            continue
        
        if in_code_block:
            current_para.append(line)
            continue
        
        if line.strip() == '':
            if current_para:
                paragraphs.append('\n'.join(current_para))
                current_para = []
        else:
            current_para.append(line)
    
    if current_para:
        paragraphs.append('\n'.join(current_para))
    
    # Reformat each paragraph
    reformatted_paragraphs = []
    for para in paragraphs:
        reformatted = reformat_paragraph(para)
        if reformatted:
            reformatted_paragraphs.append(reformatted)
    
    body = '\n\n'.join(reformatted_paragraphs)
    
    # Apply other transformations
    body = reduce_bold_overuse(body)
    body = add_section_spacing(body)
    body = improve_list_spacing(body)
    body = clean_excessive_newlines(body)
    
    body = body.strip()
    
    if frontmatter:
        return frontmatter + '\n' + body + '\n'
    return body + '\n'


def process_file(filepath: Path, dry_run: bool = False, backup: bool = False) -> dict:
    """Process a single article file."""
    with open(filepath, 'r', encoding='utf-8') as f:
        original = f.read()
    
    reformatted = reformat_article(original)
    
    original_lines = len(original.split('\n'))
    new_lines = len(reformatted.split('\n'))
    
    original_paragraphs = len([p for p in original.split('\n\n') if p.strip() and not p.strip().startswith('---')])
    new_paragraphs = len([p for p in reformatted.split('\n\n') if p.strip() and not p.strip().startswith('---')])
    
    stats = {
        'file': filepath.name,
        'original_lines': original_lines,
        'new_lines': new_lines,
        'original_paragraphs': original_paragraphs,
        'new_paragraphs': new_paragraphs,
        'changed': original != reformatted
    }
    
    if not dry_run and original != reformatted:
        if backup:
            shutil.copy(filepath, str(filepath) + '.bak')
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(reformatted)
    
    return stats


def main():
    parser = argparse.ArgumentParser(description='Reformat articles for better readability')
    parser.add_argument('--dry-run', action='store_true', help='Preview changes without writing')
    parser.add_argument('--single', type=str, help='Process only one file')
    parser.add_argument('--backup', action='store_true', help='Create .bak files')
    parser.add_argument('--verbose', '-v', action='store_true', help='Show detailed output')
    parser.add_argument('--show-sample', action='store_true', help='Show sample of reformatted content')
    args = parser.parse_args()
    
    script_dir = Path(__file__).parent
    articles_dir = script_dir.parent / ARTICLES_DIR
    
    if not articles_dir.exists():
        print(f"Error: Articles directory not found at {articles_dir}")
        sys.exit(1)
    
    if args.single:
        files = [articles_dir / args.single]
        if not files[0].exists():
            print(f"Error: File not found: {files[0]}")
            sys.exit(1)
    else:
        files = sorted(articles_dir.glob('*.md'))
    
    print(f"{'[DRY RUN] ' if args.dry_run else ''}Processing {len(files)} articles...")
    print()
    
    total_stats = {
        'processed': 0,
        'changed': 0,
        'paragraphs_added': 0,
        'lines_added': 0
    }
    
    for filepath in files:
        stats = process_file(filepath, dry_run=args.dry_run, backup=args.backup)
        total_stats['processed'] += 1
        
        if stats['changed']:
            total_stats['changed'] += 1
            total_stats['paragraphs_added'] += stats['new_paragraphs'] - stats['original_paragraphs']
            total_stats['lines_added'] += stats['new_lines'] - stats['original_lines']
            
            if args.verbose:
                print(f"✓ {stats['file']}")
                print(f"  Paragraphs: {stats['original_paragraphs']} → {stats['new_paragraphs']}")
                print(f"  Lines: {stats['original_lines']} → {stats['new_lines']}")
                
                if args.show_sample:
                    with open(filepath, 'r') as f:
                        original = f.read()
                    reformatted = reformat_article(original)
                    _, body = parse_frontmatter(reformatted)
                    print(f"  Sample:\n{body[:2000]}...")
                    print()
        elif args.verbose:
            print(f"- {stats['file']} (no changes needed)")
    
    print()
    print("=" * 50)
    print(f"Summary:")
    print(f"  Files processed: {total_stats['processed']}")
    print(f"  Files changed: {total_stats['changed']}")
    print(f"  Total paragraphs added: +{total_stats['paragraphs_added']}")
    print(f"  Total lines added: +{total_stats['lines_added']}")
    
    if args.dry_run:
        print()
        print("This was a dry run. No files were modified.")
        print("Run without --dry-run to apply changes.")


if __name__ == '__main__':
    main()
