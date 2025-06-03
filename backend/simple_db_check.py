import sqlite3
import json

# Connect to SQLite database
conn = sqlite3.connect('itrc_cc_db.sqlite')
cursor = conn.cursor()

print("🔍 Checking database tables...")

# Check applications
cursor.execute("SELECT COUNT(*) FROM applications")
app_count = cursor.fetchone()[0]
print(f"📋 Applications: {app_count}")

if app_count > 0:
    cursor.execute("SELECT id, product_name, status FROM applications LIMIT 3")
    apps = cursor.fetchall()
    for app in apps:
        print(f"   - App {app[0]}: {app[1]} (Status: {app[2]})")

# Check security targets
cursor.execute("SELECT COUNT(*) FROM security_targets")
st_count = cursor.fetchone()[0]
print(f"🎯 Security Targets: {st_count}")

if st_count > 0:
    cursor.execute("SELECT id, application_id, status FROM security_targets LIMIT 3")
    sts = cursor.fetchall()
    for st in sts:
        print(f"   - ST {st[0]}: App {st[1]} (Status: {st[2]})")

# Check class selections
cursor.execute("SELECT COUNT(*) FROM st_class_selections")
cs_count = cursor.fetchone()[0]
print(f"📂 Class Selections: {cs_count}")

if cs_count > 0:
    cursor.execute("""
        SELECT s.id, s.security_target_id, s.product_class_id, s.description
        FROM st_class_selections s
        LIMIT 3
    """)
    selections = cursor.fetchall()
    for sel in selections:
        print(f"   - Selection {sel[0]}: ST {sel[1]}, Class {sel[2]}")

# Check product classes
cursor.execute("SELECT COUNT(*) FROM product_classes")
pc_count = cursor.fetchone()[0]
print(f"🏷️ Product Classes: {pc_count}")

if pc_count > 0:
    cursor.execute("SELECT id, name_fa, code FROM product_classes LIMIT 5")
    classes = cursor.fetchall()
    for cls in classes:
        print(f"   - Class {cls[0]}: {cls[1]} ({cls[2]})")

# Check evaluation help
cursor.execute("SELECT COUNT(*) FROM evaluation_helps")
eh_count = cursor.fetchone()[0]
print(f"📚 Evaluation Help: {eh_count}")

if eh_count > 0:
    cursor.execute("SELECT id, product_class_id, help_text_fa FROM evaluation_helps LIMIT 3")
    helps = cursor.fetchall()
    for help_item in helps:
        help_text = help_item[2][:50] + "..." if len(help_item[2]) > 50 else help_item[2]
        print(f"   - Help {help_item[0]}: Class {help_item[1]} - {help_text}")

# Check users with evaluator role
cursor.execute("SELECT COUNT(*) FROM users WHERE role = 'evaluator'")
evaluator_count = cursor.fetchone()[0]
print(f"👨‍💼 Evaluators: {evaluator_count}")

if evaluator_count > 0:
    cursor.execute("SELECT id, email, full_name FROM users WHERE role = 'evaluator' LIMIT 3")
    evaluators = cursor.fetchall()
    for eval in evaluators:
        print(f"   - {eval[0]}: {eval[1]} ({eval[2]})")

conn.close()
print("\n✅ Database check completed!") 