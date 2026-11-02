---
title: "while (n--) で後ろから探す、3 行の memrchr"
description: "メモリの末尾から特定のバイトを探す関数。後ろから数えるループを while (n--) の 1 行で書き、strrchr もこの関数で実装されている。"
language: c
project: musl
repo: https://github.com/ifduyue/musl
license: MIT
copyright: "Copyright © 2005-2020 Rich Felker, et al."
commit: "7813e9119eb5fe681b6750b8a033a0490bca0941"
file: src/string/memrchr.c
lines: [3, 9]
function: "__memrchr"
difficulty: 1
format: 2
tags: [イディオム, 探索, 標準ライブラリ, 文字列処理]
---

## ひとことで

`memrchr(p, c, n)` は、アドレス `p` から始まる `n` バイトの中で、値 `c` のバイトが **最後に** 現れる場所を返します。なければ `NULL` です。
`memchr` の「後ろから探す版」で、たとえばパス `"/usr/lib/libc.so"` の最後の `'/'` を探して、ファイル名の始まりを知るのに使えます。
本体はたった 3 行です。

## コード

```c:line-numbers=3
void *__memrchr(const void *m, int c, size_t n)
{
	const unsigned char *s = m;
	c = (unsigned char)c;
	while (n--) if (s[n]==c) return (void *)(s+n);
	return 0;
}
```

ファイル末尾の `weak_alias(__memrchr, memrchr);` で、内部名 `__memrchr` が公開名 `memrchr` としても使えるようになっています。また `src/string/strrchr.c` では、`strrchr` が次のように実装されています。

<!-- source: src/string/strrchr.c -->
```c:line-numbers=3
char *strrchr(const char *s, int c)
{
	return __memrchr(s, c, strlen(s) + 1);
}
```

## 前提知識

- **ポインタ**: メモリ上の場所を指す値です。`const unsigned char *s` は「バイト（0〜255）の並びを読み取り専用で指す」ポインタです。
- **`void *`**: どんな型のデータも指せるポインタです。`memrchr` はどんなデータも受け取れるよう `void *` を使い、中で `unsigned char *` に変換します。
- **配列の添字**: `s[n]` は `s` から `n` バイト先の値です。
- **`n--`（後置デクリメント）**: 「`n` の今の値を使ってから、`n` を 1 減らす」演算です。
- **`while (n--)`**: `n` が 0 でない間ループします。条件を調べた時点で `n` は 1 減っているので、ループの中では `n` が「1 つ小さい値」になっています。
- **`size_t`**: 大きさを表す符号なし整数です。0 から 1 引くと巨大な数になります。

## 何をしているか

### 1. 型を整える

```c:line-numbers=5
	const unsigned char *s = m;
	c = (unsigned char)c;
```

受け取った `void *` を `unsigned char *` に変換し、探す値 `c` も `(unsigned char)c` で 0〜255 に収めます。これで、`c` に `-1` が渡されても値 255 のバイトとして正しく比べられます。

### 2. 後ろから 1 バイトずつ

```c:line-numbers=7
	while (n--) if (s[n]==c) return (void *)(s+n);
```

`n = 4`、データが `"a/b/"` の場合を追います。

- 1 回目: `n--` の条件で 4 を見て真、`n` は 3 になる。`s[3]` は `'/'` なので一致し、`s+3` を返す。

`'/'` ではなく `'a'` を探す場合は、`s[3]`、`s[2]`、`s[1]`、`s[0]` と調べ、`s[0]` で見つかります。どれも一致しないときは、`n` が 0 のとき条件が偽になってループを抜けます（このとき `n` は一周して巨大な数になりますが、もう使わないので問題ありません）。

### 3. 見つからなければ 0

```c:line-numbers=8
	return 0;
```

`NULL`（0）を返します。

## ここがすごい

- **添字の範囲が自然に正しくなる**: 後ろから数えるループを `for (i = n - 1; i >= 0; i--)` と書くと、`size_t` は符号なしなので `i >= 0` が常に真になり、無限ループになります。`while (n--)` なら「0 になったら終わる」判定と「添字を 1 つ減らす」操作が同時に行われ、`n-1` から `0` までを過不足なく調べられます。
- **余計な変数がない**: 引数の `n` をそのままカウンタ兼添字として使うので、変数が増えません。
- **strrchr の土台になる**: 文字列の最後の文字を探す `strrchr` は、長さを `strlen(s) + 1`（終端の 0 も含める）にして `__memrchr` を呼ぶだけで実装されています。終端まで含めるので、`strrchr(s, 0)` で終端の場所を求める、という標準の決まりも自動的に満たします。
- **トレードオフ**: musl の `memchr` は 8 バイトずつ調べますが、こちらは 1 バイトずつの素直な実装です。使われる頻度とコードの単純さを比べて、こちらは短さを選んでいると読めます。

## まとめ

- `while (n--)` は「n 回、添字 n-1 から 0 まで」回す定番のイディオム。
- 符号なし整数で後ろ向きのループを書くときは、`i >= 0` の罠に注意する。
- 長さに終端を含めるだけで、メモリ用の関数を文字列用の関数として使い回せる。
