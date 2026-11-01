---
title: "テーブルが満杯になったら、全キーを数え直して配分を決める"
description: "Lua のテーブルのハッシュ部分に空きがなくなったときの作り直し処理。キーを 2 のべき乗ごとに数え、配列部分とハッシュ部分の新しい大きさを決める。削除の多いテーブルには少し余裕を持たせる。"
language: c
project: Lua
repo: https://github.com/lua/lua
license: MIT
copyright: "Copyright (C) 1994-2026 Lua.org, PUC-Rio."
commit: "8cb93bada561977eb370819e39d7d644e5fd0a3f"
file: ltable.c
lines: [756, 791]
function: "rehash"
difficulty: 2
format: 2
tags: [データ構造, メモリ管理, アルゴリズム]
---

## ひとことで

Lua のテーブルは、番号順の整数キーを入れる **配列部分** と、それ以外を入れる **ハッシュ部分** を持っています。
ハッシュ部分に空きがなくなって新しいキーを入れられないとき、`rehash` が呼ばれ、テーブル全体のキーを数え直して 2 つの部分の新しい大きさを決めます。
たとえば `t = {}` に `t[1], t[2], t[3], …` と順に入れていくと、最初はハッシュ部分に入ったキーが、リハッシュのたびに配列部分へ移されていきます。

## コード

::: code-group

```c:line-numbers=756 [日本語訳]
/*
** テーブルをリハッシュする。まずキーを数える。配列部分の外に配列向きの
** 添字があれば、配列部分の新しい最適な大きさを計算する。
** そしてテーブルの大きさを変える。
*/
static void rehash (lua_State *L, Table *t, const TValue *ek) {
  unsigned asize;  /* 配列部分の最適な大きさ */
  Counters ct;
  unsigned i;
  unsigned nsize;  /* ハッシュ部分の大きさ */
  /* カウントをリセット */
  for (i = 0; i <= MAXABITS; i++) ct.nums[i] = 0;
  ct.na = 0;
  ct.deleted = 0;
  ct.total = 1;  /* 追加するキーを数える */
  if (ttisinteger(ek))
    countint(ivalue(ek), &ct);  /* 追加するキーは配列に入るかもしれない */
  numusehash(t, &ct);  /* ハッシュ部分のキーを数える */
  if (ct.na == 0) {
    /* 配列部分に入る新しいキーはない。同じ大きさのままにする */
    asize = t->asize;
  }
  else {  /* 配列部分の最適な大きさを計算 */
    numusearray(t, &ct);  /* 配列部分のキーを数える */
    asize = computesizes(&ct);  /* 配列部分の新しい大きさを計算 */
  }
  /* 配列部分に入らないキーはすべてハッシュ部分へ */
  nsize = ct.total - ct.na;
  if (ct.deleted) {  /* テーブルに削除済みの要素がある？ */
    /* 挿入・削除・挿入のパターン: 何度も作り直さないよう
       ハッシュに少し余分な大きさを与える */
    nsize += nsize >> 2;
  }
  /* 計算した新しい大きさにテーブルを作り直す */
  luaH_resize(L, t, asize, nsize);
}
```

```c:line-numbers=756 [原文]
/*
** Rehash a table. First, count its keys. If there are array indices
** outside the array part, compute the new best size for that part.
** Then, resize the table.
*/
static void rehash (lua_State *L, Table *t, const TValue *ek) {
  unsigned asize;  /* optimal size for array part */
  Counters ct;
  unsigned i;
  unsigned nsize;  /* size for the hash part */
  /* reset counts */
  for (i = 0; i <= MAXABITS; i++) ct.nums[i] = 0;
  ct.na = 0;
  ct.deleted = 0;
  ct.total = 1;  /* count extra key */
  if (ttisinteger(ek))
    countint(ivalue(ek), &ct);  /* extra key may go to array */
  numusehash(t, &ct);  /* count keys in hash part */
  if (ct.na == 0) {
    /* no new keys to enter array part; keep it with the same size */
    asize = t->asize;
  }
  else {  /* compute best size for array part */
    numusearray(t, &ct);  /* count keys in array part */
    asize = computesizes(&ct);  /* compute new size for array part */
  }
  /* all keys not in the array part go to the hash part */
  nsize = ct.total - ct.na;
  if (ct.deleted) {  /* table has deleted entries? */
    /* insertion-deletion-insertion: give hash some extra size to
       avoid repeated resizings */
    nsize += nsize >> 2;
  }
  /* resize the table to new computed sizes */
  luaH_resize(L, t, asize, nsize);
}
```

:::

## 前提知識

- **`Counters`**: 同じファイルで定義された構造体（複数の値をまとめた型）です。`total` はキーの総数、`na` は配列に入れられそうな整数キーの数、`deleted` は削除済みノードがあったか、`nums[i]` は 2^(i−1)+1〜2^i の範囲の整数キーの数です。
- **`&ct`**: `&` は変数のアドレス（置き場所）を取る演算子です。`numusehash(t, &ct)` のようにアドレスを渡すと、呼ばれた関数が `ct` の中身を書き換えられます。
- **`ek`**: 「extra key」、つまりいま入れようとして入らなかった新しいキーです。`ttisinteger(ek)` はそれが整数かを調べます。
- **`nsize >> 2`**: 右に 2 ビットずらすと 4 で割った値（切り捨て）になります。`nsize += nsize >> 2` は「25% 増し」です。
- **呼ばれる関数**: `countint` は整数キー 1 個を `nums` に数え、`numusehash` はハッシュ部分を、`numusearray` は配列部分を数えます。`computesizes` は数えた結果から配列部分の最適な大きさを求め、`luaH_resize` が実際に作り直します。

## 何をしているか

### 1. カウンタの初期化

```c:line-numbers=767
  for (i = 0; i <= MAXABITS; i++) ct.nums[i] = 0;
  ct.na = 0;
  ct.deleted = 0;
  ct.total = 1;  /* count extra key */
```

`nums` をすべて 0 にし、`total = 1` から始めます。この 1 は、まだテーブルに入っていない新しいキー `ek` のぶんです。

### 2. 新しいキーとハッシュ部分を数える

```c:line-numbers=771
  if (ttisinteger(ek))
    countint(ivalue(ek), &ct);  /* extra key may go to array */
  numusehash(t, &ct);  /* count keys in hash part */
```

`ek` が整数なら、配列に入る候補として数えます。次にハッシュ部分のノードを全部見て、使われているキーの総数と、その中の整数キーを数えます。

### 3. 配列部分を数えるかどうか

```c:line-numbers=774
  if (ct.na == 0) {
    /* no new keys to enter array part; keep it with the same size */
    asize = t->asize;
  }
  else {  /* compute best size for array part */
    numusearray(t, &ct);  /* count keys in array part */
    asize = computesizes(&ct);  /* compute new size for array part */
  }
```

ここまでで `ct.na == 0`、つまり「ハッシュ部分にも新しいキーにも、配列に移せそうな整数キーがない」なら、配列部分は今のままにします。配列部分を数える処理を丸ごと省略できます。
そうでなければ、配列部分も数えてから `computesizes` で最適な大きさを計算します。

### 4. ハッシュ部分の大きさ

```c:line-numbers=783
  nsize = ct.total - ct.na;
  if (ct.deleted) {  /* table has deleted entries? */
    /* insertion-deletion-insertion: give hash some extra size to
       avoid repeated resizings */
    nsize += nsize >> 2;
  }
```

配列に入らないキーは全部ハッシュ部分へ行くので、その数は `total - na` です。
削除済みのノードがあった場合（`ct.deleted`）は、25% 増やします。たとえば必要数が 8 なら 8 + 2 = 10 にします。`luaH_resize` の側で 2 のべき乗に切り上げられるので、実際は 16 になります。

### 5. 作り直す

```c:line-numbers=790
  luaH_resize(L, t, asize, nsize);
```

決まった 2 つの大きさで `luaH_resize` を呼び、すべてのキーを入れ直します。

## ここがすごい

- **「使う量」から大きさを決める**: 単純なハッシュ表は「満杯になったら 2 倍」にしがちです。Lua は実際に使われているキーを数えて決めるので、削除が多くて中身が減っていればテーブルは縮みます。満杯で呼ばれたのに小さくなることもある、というのがおもしろい点です。
- **配列とハッシュの間でキーを移す**: 整数キーの分布を数えることで、ハッシュ部分にたまった `t[5]`, `t[6]` などを配列部分に移せます。配列部分のほうが 1 要素あたりのメモリが小さく、アクセスも速いので、配列のように使われるテーブルは自然と配列らしい形になります。
- **数えなくてよいときは数えない**: 配列に移すキーがなければ、配列部分（大きいことが多い）を走査しません。リハッシュはまれですが、大きなテーブルではこの省略が効きます。
- **削除と挿入の繰り返しへの対策**: コード中のコメントにあるとおり、「入れる・消す・入れる」を繰り返すテーブルは、ちょうどの大きさにするとすぐにまた満杯になり、作り直しを繰り返しかねません。削除済みノードがあるときだけ少し余裕を持たせることで、これを避けています。

## まとめ

- テーブルの作り直しは「全キーを数える → 配分を決める → 入れ直す」の 3 段階。
- 大きさを「いま実際に使っている量」から決めると、増えるだけでなく縮むこともできる。
- 統計（2 のべき乗ごとの個数）を集めておくと、配列とハッシュの最適な配分を決められる。
- 繰り返し作り直しになるパターンには、少しの余裕を持たせて対処する。
