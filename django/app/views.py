from django.shortcuts import render, redirect, reverse
from django.http import JsonResponse, HttpRequest

def index(request):
    return render(request, 'index.html')