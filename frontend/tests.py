#!/usr/bin/python3
import compiler

EXIT_CODE = 0

def _print_result(name, success=True):
    result = {
        True: "success",
        False: "failure"
    }[success]
    global EXIT_CODE
    if EXIT_CODE == 0 and not success:
        EXIT_CODE = 1
    print(f"{name}:", result)

def remove_comments():
    text = "12345\n\n <!-- dsfsfdsdf\n\r\n sdfsdf --> SALUT\n<!--é-->é"
    expected = "12345\n\n  SALUT\né"
    try:
        assert(compiler.remove_comments(text) == expected)
        success = True
    except:
        success = False
    _print_result("remove_comments", success)

if __name__ == "__main__":
    remove_comments()
    