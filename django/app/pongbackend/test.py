
byte = b'\x05\x00\x02\x03\x04\x05\x06\x07\x08\x09\x0a\x0b\x0c\x0d\x0e\x0f'

print(byte[0])
print(byte[1:2])
print(byte[1:1])
print(byte[1:3])
print(byte[1:3][1])

print(int.from_bytes(byte[1:3]))

print('test done')
