---
title: "ヒープの森の根を左へ渡り歩かせる smoothsort の trinkle"
description: "musl の qsort（smoothsort）で、複数の木の根が左から右へ昇順になるよう整える関数。根を左隣の木の根と比べながら移していき、最後に sift で木の中へ沈める。ビット列で木の並びを管理する。"
language: c
project: musl
repo: https://github.com/ifduyue/musl
license: MIT
copyright: "Copyright (C) 2011 by Lynn Ochs"
commit: "7813e9119eb5fe681b6750b8a033a0490bca0941"
file: src/stdlib/qsort.c
lines: [127, 164]
function: "trinkle"
difficulty: 3
format: 2
tags: [ソート, アルゴリズム, ビット演算, データ構造]
---

## ひとことで

smoothsort は、配列を大きさの違う **いくつかのヒープ（レオナルド木）が左から右へ並んだ「森」** として扱います。並べ替えの途中で守りたい決まりは、

1. 各木はヒープになっている（根がその木で最大）
2. 木の根を左から右へ見ると、昇順になっている

の 2 つです。`trinkle` は、いちばん右の木の根を、2 番目の決まりを満たす場所まで **左の木の根へ渡り歩かせ**、最後にその木の中へ沈めます。

## コード

```c:line-numbers=127
static void trinkle(unsigned char *head, size_t width, cmpfun cmp, void *arg, size_t pp[2], int pshift, int trusty, size_t lp[])
{
	unsigned char *stepson,
	              *rt, *lf;
	size_t p[2];
	unsigned char *ar[AR_LEN];
	int i = 1;
	int trail;

	p[0] = pp[0];
	p[1] = pp[1];

	ar[0] = head;
	while(p[0] != 1 || p[1] != 0) {
		stepson = head - lp[pshift];
		if(cmp(stepson, ar[0], arg) <= 0) {
			break;
		}
		if(!trusty && pshift > 1) {
			rt = head - width;
			lf = head - width - lp[pshift - 2];
			if(cmp(rt, stepson, arg) >= 0 || cmp(lf, stepson, arg) >= 0) {
				break;
			}
		}

		ar[i++ & AR_MASK] = stepson;
		head = stepson;
		trail = pntz(p);
		shr(p, trail);
		pshift += trail;
		trusty = 0;
	}
	if(!trusty) {
		cycle(width, ar, i & AR_MASK);
		sift(head, width, cmp, arg, pshift, lp);
	}
}
```

## 前提知識

- **ヒープとレオナルド木**: ヒープは親が子以上の木です。レオナルド木は大きさ 1, 1, 3, 5, 9, 15, … の木で、配列上で「左の木・右の木・根」の順に並び、根が末尾に来ます。`lp[k]` は次数 k の木のバイト数です。
- **木の並びのビット列 `p`**: `size_t` 2 個で表した 2 ワードのビット列です。ビット 0 が「今いる木（次数 `pshift`）」、ビット i が立っていれば「次数 `pshift + i` の木が左にある」ことを表します。
- **`pntz(p)`**: 最下位ビットを除いて、次に立っているビットの位置を返す関数です。左隣の木が何次数ぶん離れているかがわかります。
- **`shr(p, n)`**: 2 ワードのビット列を右に `n` ずらす関数です。
- **`cmp(a, b, arg)`**: 利用者が渡す比較関数です。`a` が大きければ正、小さければ負を返します。
- **`trusty`**: 「今の木の中身はすでにヒープになっていると信頼できるか」のフラグです。

## 何をしているか

### 1. 準備

```c:line-numbers=136
	p[0] = pp[0];
	p[1] = pp[1];

	ar[0] = head;
```

呼び出し元のビット列 `pp` をコピーして `p` を作ります（元を壊さないため）。`ar[0]` に、動かしたい根の場所を記録します。

### 2. 左隣の木の根と比べる

```c:line-numbers=140
	while(p[0] != 1 || p[1] != 0) {
		stepson = head - lp[pshift];
		if(cmp(stepson, ar[0], arg) <= 0) {
			break;
		}
```

`p` が `{1, 0}`（今の木だけ）でない間、左隣の木があります。今の木の大きさは `lp[pshift]` なので、その分だけ前が左隣の木の根です（`stepson`）。左隣の根が `ar[0]` 以下なら、もう昇順になっているので止まります。

### 3. 子より小さい左隣とは入れ替えない

```c:line-numbers=145
		if(!trusty && pshift > 1) {
			rt = head - width;
			lf = head - width - lp[pshift - 2];
			if(cmp(rt, stepson, arg) >= 0 || cmp(lf, stepson, arg) >= 0) {
				break;
			}
		}
```

左隣の根のほうが大きくても、今の木の子（`rt`、`lf`）がそれ以上なら、左隣の根をここへ持ってくるとヒープの決まりが崩れます。その場合は止まり、あとで `sift` に任せます。`trusty` が真のときは、この確認を省略します。

### 4. 左の木へ移る

```c:line-numbers=153
		ar[i++ & AR_MASK] = stepson;
		head = stepson;
		trail = pntz(p);
		shr(p, trail);
		pshift += trail;
		trusty = 0;
```

左隣の根の場所を `ar` に記録して、`head` をそこへ移します。`pntz(p)` で左隣の木までのビットの距離を求め、`shr` で `p` をずらし、`pshift` に足して、左隣の木の次数を今の次数にします。移った先の木の中身は確認していないので、`trusty = 0` にします。

### 5. 回転して沈める

```c:line-numbers=160
	if(!trusty) {
		cycle(width, ar, i & AR_MASK);
		sift(head, width, cmp, arg, pshift, lp);
	}
```

一度でも移動していれば（`!trusty`）、`cycle` で記録した根たちを回転させます。元の根が最終的な木の根の位置に入り、各左隣の根が 1 つ右の木の根へずれます。最後に、移った先の木で `sift` を行い、元の根を正しい深さへ沈めます。

## ここがすごい

- **森の構造をビット列で持つ**: どの次数の木が並んでいるかを、木の数だけのリストではなく 2 ワードのビット列で表しています。左隣の木への移動は「次に立っているビットを探して、その分ずらす」だけで、メモリを追加で使いません。
- **交換せずに記録して回転**: `sift` と同じく、渡り歩く間は要素を書き換えず、最後に `cycle` で 1 回だけ動かします。k 本の木を渡っても、コピーは k+1 回です。
- **余計な比較を省く `trusty`**: 木を分解した直後のように、子の側がすでに正しいとわかっている場面では、`if(!trusty && pshift > 1)` の確認を省けます。呼び出し側が持っている情報をフラグで渡し、比較回数を減らしています。
- **決まりを 2 段に分けて守る**: 「根の昇順」は `trinkle` が、「各木のヒープ性」は `sift` が担当します。この分担のおかげで、並べ替えの最終段階では右端の根が常に最大となり、取り除くだけで済みます。

## まとめ

- smoothsort は「ヒープの森」を使い、根が昇順になるよう保つことで最大値を右端に置く。
- 可変個の木の並びも、ビット列にすればワード 2 個で表せる。
- 呼び出し側が知っている事実をフラグで渡すと、不要な比較を省ける。
