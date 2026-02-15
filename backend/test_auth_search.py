from database import get_db

def test_auth_select():
    global db
    db = get_db()
    try:
        res = db.auth.admin.list_users()
        print(f"Type of res: {type(res)}")
        # Inspect res
        # If it is UserList, try dir(res)
        # If list, just print length
        if isinstance(res, list):
            print(f"List length: {len(res)}")
            if len(res) > 0:
                 print(f"First user: {res[0]} (Type: {type(res[0])})")
        else:
             print(f"Result dir: {dir(res)}")
        
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_auth_select()
