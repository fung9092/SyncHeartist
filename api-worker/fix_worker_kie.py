import os
path = 'src/index.ts'
with open(path, 'r') as f:
    content = f.read()

# Update Worker for Kie AI
content = content.replace('OPENROUTER_API_KEY', 'KIE_AI_API_KEY')
content = content.replace('https://openrouter.ai/api/v1/chat/completions', 'https://api.kie.ai/v1/chat/completions')
content = content.replace('deepseek/deepseek-chat', 'deepseek-chat')

with open(path, 'w') as f:
    f.write(content)
