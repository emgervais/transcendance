import unidecode
from users.models import User

def generate_username(first_name, last_name):
    def _normalize(name):
        name = name.lower()
        name = unidecode.unidecode(name)
        name = name.replace(' ', '-')
        return name
    first_name = _normalize(first_name)
    last_name = _normalize(last_name)
    number = 0
    while True:
        for i in range(len(first_name)):
            username = (first_name[:i+1] + last_name)[:8]
            if number:
                username += str(number)
            if not User.objects.filter(username=username).exists():
                return username
        number += 1
        
