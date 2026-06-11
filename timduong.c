#include <stdio.h>
#include <stdint.h>
#include <math.h>
#include <string.h>
#include <stdlib.h>
#include <ctype.h>

#define inf 1000000000
int dist[100];
int open[100];
int prev[100];

void nhap(int a[100][100], int n){
   for(int i=0;i<n;i++){
      for(int j=0;j<n;j++){
         scanf("%d", &a[i][j]);
      }
   }
}

void dijkstra(int a[100][100], int n, int src){
   for(int i=0;i<n;i++){
      dist[i]=inf;
      open[i]=1;
      prev[i]=-1;
   }
   dist[src]=0;
   while(1){
      int min = inf;
      int u=-1;
        for(int i=0; i<n; i++){
            if(open[i] && dist[i]<min){
                min = dist[i];
                u=i;
            }
        }
      if(u==-1) return;
      open[u]=0;
      for(int v=0;v<n;v++){
         if(a[u][v]>0){
            int b = a[u][v];
            if(dist[v]>dist[u]+b){
               dist[v]=dist[u]+b;
               prev[v]=u;
            }
         }
      }
   }
}

void duongdi(int v){
   if(v==-1) return;
   duongdi(prev[v]);
   char c = 'A'+v;
   printf("%c ", c);
}

int main(){
   int n;
   printf("Nhap n: ");
   scanf("%d", &n);
   int a[100][100];
   printf("Nhap ma tran\n");
   nhap(a,n);
   int src=0;
   dijkstra(a,n,src);
   char dinh = 'A';
   int k=1;
   while(k<=n){
      printf("%d.%c\n",k,dinh);
      k++;
      dinh +=1;
   }
   while(1){
   printf("Nhap lua chon:");
   int p;
   scanf("%d", &p);
   if(p>n){
         printf("Ket thuc!"); break;}
   dinh = 'A'+p-1;
   printf("A->%c : %d\n",dinh, dist[p-1]);
   duongdi(p-1);
   printf("\n");
   }
   return 0;
}

