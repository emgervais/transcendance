import re

def censor(message):
    tokens = tokenize(message)
    censored_tokens = []
    for token in tokens:
        if token.lower() in get_swear_words():
            censored_tokens.append(replace_vowels(token))
        else:
            censored_tokens.append(token)
    censored_message = ''.join(censored_tokens)
    return censored_message

def tokenize(message):
    separator_pattern = r'([^a-zA-Z0-9]+)'
    tokens = re.split(separator_pattern, message)
    tokens = [token for token in tokens if token]
    return tokens

SWEAR_WORDS = []
def get_swear_words():
    global SWEAR_WORDS
    if SWEAR_WORDS:
        return SWEAR_WORDS
    with open("./static/txt/swearWords.txt", "r", encoding="utf-8") as f:
        for line in f:
            SWEAR_WORDS.append(line.strip())
    return SWEAR_WORDS

def replace_vowels(word, repl="*"):
    vowels = "aeiouy"
    new_word = ""
    for letter in word:
        if letter.lower() in vowels:
            new_word += repl
        else:
            new_word += letter
    return new_word
