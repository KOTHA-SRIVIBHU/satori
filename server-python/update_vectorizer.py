import re

with open('tags_output.txt', 'r') as f:
    lines = f.readlines()
    tags_array_str = lines[1].strip()

with open('app/services/vectorizer.py', 'r') as f:
    content = f.read()

# Replace TOP_TAGS
content = re.sub(r'TOP_TAGS = \[.*?\]', f'TOP_TAGS = {tags_array_str}', content, flags=re.DOTALL)

# Update tag weight multiplier and comment
content = content.replace('# 2. Weighted Tag Encoding (50 dim)', '# 2. Weighted Tag Encoding (300 dim)')
content = content.replace('tag_vector = [tag_dict.get(t, 0.0) / 100.0 for t in TOP_TAGS]', 'tag_vector = [(tag_dict.get(t, 0.0) / 100.0) * 1.5 for t in TOP_TAGS]')

with open('app/services/vectorizer.py', 'w') as f:
    f.write(content)

