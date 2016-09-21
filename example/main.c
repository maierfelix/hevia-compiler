#include <stdio.h>

void swap(int *c, int *d) {
  const int tmp = *c;
  *c = *d;
  *d = tmp;
}

int a = 1337;
int b = 1338;

swap(&a, &b);