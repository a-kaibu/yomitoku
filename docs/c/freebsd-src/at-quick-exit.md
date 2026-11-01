---
title: "ロックを使わず 1 命令の比較交換でリストの先頭に追加する at_quick_exit"
description: "C11 の at_quick_exit を FreeBSD がどう実装しているか。終了時に呼ぶ関数を連結リストに積むとき、ミューテックスではなく atomic_compare_exchange_strong のループで複数スレッドから安全に追加している。"
language: c
project: FreeBSD
repo: https://github.com/freebsd/freebsd-src
license: BSD-2-Clause
copyright: "Copyright (c) 2011 David Chisnall; Copyright (c) 2023 Klara, Inc."
commit: "0a12444b2989c38a5d2e358e0f9ef01c665cc268"
file: lib/libc/stdlib/quick_exit.c
lines: [35, 61]
function: "at_quick_exit"
difficulty: 2
format: 2
tags: [並行処理, ロック不要, データ構造, 標準ライブラリ]
---

## ひとことで

`at_quick_exit` は、プログラムが `quick_exit()` で終わるときに呼んでほしい関数を登録する、C11 で追加された標準関数です。
登録された関数は、登録と **逆の順番** で呼ばれます。
FreeBSD の実装は、登録された関数を連結リストの先頭に積んでいくだけの短いコードですが、複数のスレッドが同時に登録しても壊れないよう、**ロックを使わない比較交換（CAS）** で先頭を差し替えています。

## コード

::: code-group

```c:line-numbers=35 [日本語訳]
/**
 * quick exit ハンドラの連結リスト。quick_exit() が呼ばれると、登録の
 * 逆順に呼び出される。atexit() 版より簡単なのは、C++ の
 * デストラクタや DSO（共有ライブラリ）ごとの後始末に
 * 対応しなくてよいからである。
 */
struct quick_exit_handler {
	struct quick_exit_handler *next;
	void (*cleanup)(void);
};

static _Atomic(struct quick_exit_handler *) handlers;

int
at_quick_exit(void (*func)(void))
{
	struct quick_exit_handler *h;

	if ((h = calloc(1, sizeof(*h))) == NULL) {
		return (-1);
	}
	h->cleanup = func;
	while (!atomic_compare_exchange_strong(&handlers, &h->next, h)) {
		/* 何もしない */ ;
	}
	return (0);
}
```

```c:line-numbers=35 [原文]
/**
 * Linked list of quick exit handlers.  These will be invoked in reverse
 * order of insertion when quick_exit() is called.  This is simpler than
 * the atexit() version, because it is not required to support C++
 * destructors or DSO-specific cleanups.
 */
struct quick_exit_handler {
	struct quick_exit_handler *next;
	void (*cleanup)(void);
};

static _Atomic(struct quick_exit_handler *) handlers;

int
at_quick_exit(void (*func)(void))
{
	struct quick_exit_handler *h;

	if ((h = calloc(1, sizeof(*h))) == NULL) {
		return (-1);
	}
	h->cleanup = func;
	while (!atomic_compare_exchange_strong(&handlers, &h->next, h)) {
		/* nothing */ ;
	}
	return (0);
}
```

:::

## 前提知識

- **連結リスト**: 各要素が「次の要素へのポインタ」を持ってつながるデータ構造です。ここでは `struct quick_exit_handler` が `next`（次の要素）と `cleanup`（呼ぶ関数）を持ちます。
- **関数ポインタ**: `void (*cleanup)(void)` は「引数も戻り値もない関数」の場所を入れる変数です。`h->cleanup()` で、その関数を呼び出せます。
- **`struct` と `->`**: `h->next` は「ポインタ `h` が指す構造体の `next`」です。
- **`calloc`**: メモリを借りて中身をすべて 0 にする関数です。ポインタも 0、つまり `NULL` から始まります。失敗すると `NULL` を返します。
- **`_Atomic` と原子的操作**: 複数のスレッドが同じ変数を同時に読み書きすると、途中の状態が見えて壊れることがあります。`_Atomic` を付けた変数は、`stdatomic.h` の関数で「割り込まれない 1 つの操作」として読み書きできます。
- **`atomic_compare_exchange_strong(obj, expected, desired)`**: 「`*obj` が `*expected` と等しければ `desired` に書き換えて真を返す。違えば `*expected` に今の `*obj` を書き込んで偽を返す」という操作を、まとめて 1 回で行います。比較交換（compare-and-swap、CAS）と呼ばれます。
- **`static`**: ファイルの外から見えない、プログラムの実行中ずっと残る変数です。

## 何をしているか

### 1. 新しい要素を作る

```c:line-numbers=53
	if ((h = calloc(1, sizeof(*h))) == NULL) {
		return (-1);
	}
	h->cleanup = func;
```
`calloc` で要素を 1 つ作ります。`calloc` なので `h->next` は `NULL` です。登録する関数 `func` を `cleanup` に入れます。

### 2. 比較交換で先頭に差し込む

```c:line-numbers=57
	while (!atomic_compare_exchange_strong(&handlers, &h->next, h)) {
		/* nothing */ ;
	}
```
`atomic_compare_exchange_strong(&handlers, &h->next, h)` は、「リストの先頭 `handlers` が `h->next` と同じなら、先頭を `h` に替える」という意味です。

- 1 回目、`h->next` は `NULL` です。リストが空なら一致するので、先頭が `h` になって終わります。
- リストが空でなければ一致しません。このとき CAS は **今の先頭を `h->next` に書き込んで** 偽を返します。
- 2 回目は、`h->next` が今の先頭なので、ほかのスレッドが割り込んでいなければ一致し、`h` が新しい先頭になります。`h` の次は元の先頭なので、リストがつながります。

ループの本体は空です（`/* nothing */`）。必要な仕事はすべて CAS の中で起きています。

### 3. 具体例

関数 A、B の順に登録されているとき、リストは `B → A` です。スレッド 1 が C を、スレッド 2 が D をほぼ同時に登録したとします。
両方とも先頭を `B` と読んだあと、スレッド 1 の CAS が先に成功すると先頭は `C → B → A` になります。スレッド 2 の CAS は「先頭が B のはず」が外れて失敗し、`h->next` が `C` に更新されます。次の CAS で成功して `D → C → B → A` になります。どちらの登録も失われません。

### 4. 呼び出す側（参考）

```c:line-numbers=63
void
quick_exit(int status)
{
	struct quick_exit_handler *h;

	/*
	 * XXX: The C++ spec requires us to call std::terminate if there is an
	 * exception here.
	 */
	for (h = atomic_load_explicit(&handlers, memory_order_acquire);
	     h != NULL; h = h->next) {
		h->cleanup();
	}
	_Exit(status);
}
```

`quick_exit` は先頭から順にたどって `cleanup` を呼びます。先頭に積んだので、自然に「後から登録したものが先」に呼ばれます。

## ここがすごい

- **逆順の要件がリストの形で満たされる**: 「登録の逆順に呼ぶ」という規格の決まりを、先頭への追加と先頭からの走査だけで実現しています。配列と添字を管理する必要がありません。
- **ロックが要らない**: ミューテックス（排他ロック）で守る方法もありますが、ロックの初期化や後始末が必要です。終了処理はプログラムの最後の最後に動くので、扱う道具は少ないほど安全です。このコードは 1 つの原子的な変数だけで済ませています。
- **CAS の失敗を「更新」に使う**: CAS が失敗したとき、`expected` に今の値が書き戻されるという仕様をうまく使い、`h->next` の付け直しを別に書かずに済ませています。`calloc` で `next` が `NULL` から始まることも、1 回目の比較にそのまま役立っています。
- **追加しかしないから簡単**: ロック不要のリストで難しいのは要素の削除です（同時に外そうとすると、すでに解放されたメモリを触る危険がある）。ここでは登録の取り消しがないので、先頭への追加だけを考えればよく、短く正しいコードになっています。

## まとめ

- 比較交換（CAS）は「期待どおりなら書き換え、違えば今の値を教える」1 回の原子的操作。
- CAS をループで回すと、ロックなしで連結リストの先頭に安全に追加できる。
- 先頭に積んで先頭から読めば、自然に「後入れ先出し」の順番になる。
- 削除がないデータ構造なら、ロック不要の実装もとても短く書ける。
