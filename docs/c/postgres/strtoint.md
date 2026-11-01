---
title: "long を int に押し込めたかを (int) val と比べて確かめる strtoint"
description: "標準の strtol を包んで int を返す関数。いったん int にキャストして値が変わったかで範囲外を検出し、strtol と同じ流儀で上限・下限に丸めて errno を立てる。"
language: c
project: PostgreSQL
repo: https://github.com/postgres/postgres
license: PostgreSQL
copyright: "Copyright (c) 1996-2026, PostgreSQL Global Development Group"
commit: "fa5ecff759b1c6766172c375e83b109ad6a7ecf1"
file: src/common/string.c
lines: [48, 66]
function: "strtoint"
difficulty: 1
format: 2
tags: [エラー処理, 数値計算, 移植性, 標準ライブラリ]
---

## ひとことで

`strtoint` は、文字列を整数に変換する標準関数 `strtol` とほぼ同じ働きをしますが、結果を `long` ではなく **`int` で返す** 関数です。
たとえば `strtoint("123abc", &end, 10)` は `123` を返し、`end` は `"abc"` の先頭を指します。
`int` に入らない大きな数（`"99999999999"` など）を渡すと、`int` の最大値 `INT_MAX` を返し、`errno` に `ERANGE`（範囲外）を設定します。

## コード

::: code-group

```c:line-numbers=48 [日本語訳]
/*
 * strtoint --- strtol とまったく同じだが、long ではなく int を返す
 *
 * 結果は LONG_MIN..LONG_MAX ではなく INT_MIN..INT_MAX に丸められるが、
 * それ以外は strtol と同じふるまいをする。
 */
int
strtoint(const char *pg_restrict str, char **pg_restrict endptr, int base)
{
	long		val;

	val = strtol(str, endptr, base);
	if (val != (int) val)
	{
		val = (val < 0) ? INT_MIN : INT_MAX;
		errno = ERANGE;
	}
	return (int) val;
}
```

```c:line-numbers=48 [原文]
/*
 * strtoint --- just like strtol, but returns int not long
 *
 * The result is clamped to INT_MIN..INT_MAX, not LONG_MIN..LONG_MAX,
 * but otherwise this has the same behavior as strtol.
 */
int
strtoint(const char *pg_restrict str, char **pg_restrict endptr, int base)
{
	long		val;

	val = strtol(str, endptr, base);
	if (val != (int) val)
	{
		val = (val < 0) ? INT_MIN : INT_MAX;
		errno = ERANGE;
	}
	return (int) val;
}
```

:::

## 前提知識

- **`int` と `long`**: どちらも符号付き整数の型です。`int` はたいてい 32 ビット（約 ±21 億）です。`long` は環境によって 32 ビットか 64 ビットで、Linux などの 64 ビット環境では 64 ビット、Windows では 32 ビットです。
- **`strtol(str, endptr, base)`**: 文字列 `str` を `base` 進数（10 なら 10 進数）として読み、`long` を返す標準関数です。数字でない文字に出会ったところで止まり、その位置を `*endptr` に書き込みます。値が `long` に入らなければ `LONG_MAX` か `LONG_MIN` を返し、`errno` を `ERANGE` にします。
- **`char **endptr`**: 「`char *` を書き込む場所」へのポインタです。関数が呼び出し元の変数を書き換えるために使います。
- **`errno`**: 標準ライブラリの関数がエラーの種類を伝えるための変数です。
- **キャスト `(int) val`**: 値を `int` 型に変換します。`int` に入りきらない値を変換すると、普通の環境では上の桁が捨てられて別の値になります（規格上は処理系定義）。
- **`pg_restrict`**: C の `restrict` を環境に合わせて書くマクロで、「この 2 つのポインタは同じ場所を指さない」とコンパイラに伝え、最適化を助けます。
- **三項演算子 `a ? b : c`**: `a` が真なら `b`、偽なら `c` になります。

## 何をしているか

### 1. まず long で読む

```c:line-numbers=59
	val = strtol(str, endptr, base);
```

`strtol` に仕事を任せます。符号の処理、空白の読み飛ばし、`0x` の扱いなどはすべて標準関数の流儀どおりです。

### 2. int に入るかを確かめる

```c:line-numbers=60
	if (val != (int) val)
```

`val != (int) val` は「`int` に変換して戻したときに値が変わるか」を調べています。
64 ビットの `long` で `val = 5000000000`（50 億）なら、`(int) val` は上の桁が捨てられて `705032704` になり、元と違うので範囲外とわかります。
`val = 123` なら変換しても `123` のままなので、何もしません。

### 3. 範囲外なら上限・下限に丸める

```c:line-numbers=62
		val = (val < 0) ? INT_MIN : INT_MAX;
		errno = ERANGE;
```

負の数なら `INT_MIN`、正の数なら `INT_MAX` にそろえ、`errno` を `ERANGE` にします。これは `strtol` が `long` の範囲外で行うのと同じふるまいを、`int` の範囲で再現したものです（関数の前のコメントより）。

### 4. int にして返す

```c:line-numbers=65
	return (int) val;
```

この時点の `val` は必ず `int` に収まるので、安全に変換して返します。

## ここがすごい

- **範囲チェックを型そのものに任せる**: 素直に書くなら `if (val > INT_MAX || val < INT_MIN)` です。`val != (int) val` は、「`int` に入る」ことの定義をそのまま式にしたもので、`INT_MAX` などの定数を持ち出さずに済みます。比較を 1 回にまとめられるのも利点です。
- **32 ビットの long でも正しい**: `long` が 32 ビットの環境では、`long` と `int` は同じ範囲なので、`(int) val` は常に `val` と等しく、チェックは自然に何もしなくなります。範囲外の場合は `strtol` 自身がすでに `LONG_MAX` と `ERANGE` を返しており、それは `INT_MAX` と同じ値です。環境ごとの `#if` を書かずに、どちらでも正しく動きます。
- **既存の関数と同じ約束を守る**: 呼ぶ側は「`strtol` の `int` 版」として、`errno` や `endptr` の扱いを同じ感覚で使えます。新しいエラー報告の方法を作らないので、覚えることが増えません。
- **薄いラッパーに徹する**: 文字列の解析そのものは一切自分で書かず、標準関数に任せています。バグが入り込む余地が小さく、コード量も最小です。

## まとめ

- 「狭い型に入るか」は、狭い型にキャストして値が変わらないかで確かめられる。
- 標準関数を包むときは、エラーの伝え方（戻り値・`errno`）も元の関数に合わせる。
- `long` の大きさが環境で違っても、型の性質に任せた書き方なら `#if` なしで移植できる。
- 解析処理を自作せず、実績のある関数に任せると安全で短い。
