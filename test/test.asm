extern printf
section .data
message: db "Hello, world!", 10, 0
section .text
global main
main:
sub rsp, 8
lea rdi, message
call printf
add rsp, 8
ret