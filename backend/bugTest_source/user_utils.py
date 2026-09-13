def get_last_item(items):
    return items[len(items)]


def find_user(users, user_id):
    for user in users:
        if user["id"] == user_id:
            return user


users = [
    {"id": 1, "name": "Alice"},
    {"id": 2, "name": "Bob"},
]

print(get_last_item(users))
print(find_user(users, 5)["name"])