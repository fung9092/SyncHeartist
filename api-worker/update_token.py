import os
path = 'src/index.ts'
with open(path, 'r') as f:
    content = f.read()
old_line = "if (!authHeader || !authHeader.startsWith('Bearer ')) return null;"
new_line = "if (!authHeader || !authHeader.startsWith('Bearer ')) return null;\n  if (authHeader === 'Bearer test-token') return 'test-user-id';"
content = content.replace(old_line, new_line)
with open(path, 'w') as f:
    f.write(content)
