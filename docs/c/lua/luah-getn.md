---
title: "「#t」はどう数える？ ヒントと二分探索でテーブルの長さを探す"
description: "Lua の長さ演算子 # の本体。前回の答えをヒントに近くを数マスだけ調べ、だめなら二分探索に切り替える。末尾に 1 個足す・消すという典型パターンをほぼ一瞬で処理する。"
language: c
project: Lua
repo: https://github.com/lua/lua
license: MIT
copyright: "Copyright (C) 1994-2026 Lua.org, PUC-Rio."
commit: "8cb93bada561977eb370819e39d7d644e5fd0a3f"
file: ltable.c
lines: [1290, 1343]
function: "luaH_getn"
difficulty: 2
format: 2
tags: [探索, アルゴリズム, キャッシュ, データ構造]
---

## ひとことで

Lua では `#t` と書くとテーブル `t` の「長さ」が得られます。`t = {10, 20, 30}` なら `#t` は `3` です。
ただし Lua のテーブルは途中に穴があってもよいので、長さは「`t[n]` に値があり、`t[n+1]` が空になる n」（**境界**、border）のどれか 1 つ、と定義されています。
`luaH_getn` はその境界を探す関数で、**前回の答えをヒントとして覚えておき、その近くから探す** ことで、よくある使い方を高速にしています。

## コード

::: code-group

```c:line-numbers=1290 [日本語訳]
/*
** テーブル 't' の境界を探す。（「境界」とは、t[i] があり t[i+1] がない
** 整数の添字 i のこと。t[1] がなければ 0、
** t[maxinteger] があれば 'maxinteger'。）
** 配列部分があれば、そこで境界を探す。まず前回の結果（ヒント）の
** 近くを探す。これは 't[#t + 1] = val' や 't[#t] = nil' のように
** 境界を 1 つだけ動かす場合に対応するため。
** だめなら二分探索で境界を探す。
** 配列部分がないか、その最後の要素が空でなければ、
** 境界はハッシュ部分にあるかもしれない。
*/
lua_Unsigned luaH_getn (lua_State *L, Table *t) {
  unsigned asize = t->asize;
  if (asize > 0) {  /* 配列部分はあるか？ */
    const unsigned maxvicinity = 4;
    unsigned limit = *lenhint(t);  /* ヒントから始める */
    if (limit == 0)
      limit = 1;  /* limit を配列の有効な添字にする */
    if (arraykeyisempty(t, limit)) {  /* t[limit] は空か？ */
      /* 'limit' より前に境界があるはず */
      unsigned i;
      /* ヒントの近くで境界を探す */
      for (i = 0; i < maxvicinity && limit > 1; i++) {
        limit--;
        if (!arraykeyisempty(t, limit))
          return newhint(t, limit);  /* 'limit' が境界 */
      }
      /* t[limit] はまだ空。[0, limit) で境界を探す */
      return newhint(t, binsearch(t, 0, limit));
    }
    else {  /* 'limit' はテーブルにある。その後ろで境界を探す */
      unsigned i;
      /* ヒントの近くで境界を探す */
      for (i = 0; i < maxvicinity && limit < asize; i++) {
        limit++;
        if (arraykeyisempty(t, limit))
          return newhint(t, limit - 1);  /* 'limit - 1' が境界 */
      }
      if (arraykeyisempty(t, asize)) {  /* 最後の要素は空か？ */
        /* t[limit] は空でない。[limit, asize) で境界を探す */
        return newhint(t, binsearch(t, limit, asize));
      }
    }
    /* 最後の要素は空でない。次に速く見つけられるようヒントを設定 */
    /* （ハッシュ部分のキーはヒントにできない） */
    *lenhint(t) = asize;
  }
  /* 配列部分がないか t[asize] が空でない。ハッシュ部分を調べる */
  lua_assert(asize == 0 || !arraykeyisempty(t, asize));
  if (isdummy(t) || hashkeyisempty(t, asize + 1))
    return asize;  /* 'asize + 1' は空 */
  else  /* 'asize + 1' も空でない */
    return hash_search(L, t, asize);
}
```

```c:line-numbers=1290 [原文]
/*
** Try to find a border in table 't'. (A 'border' is an integer index
** such that t[i] is present and t[i+1] is absent, or 0 if t[1] is absent,
** or 'maxinteger' if t[maxinteger] is present.)
** If there is an array part, try to find a border there. First try
** to find it in the vicinity of the previous result (hint), to handle
** cases like 't[#t + 1] = val' or 't[#t] = nil', that move the border
** by one entry. Otherwise, do a binary search to find the border.
** If there is no array part, or its last element is non empty, the
** border may be in the hash part.
*/
lua_Unsigned luaH_getn (lua_State *L, Table *t) {
  unsigned asize = t->asize;
  if (asize > 0) {  /* is there an array part? */
    const unsigned maxvicinity = 4;
    unsigned limit = *lenhint(t);  /* start with the hint */
    if (limit == 0)
      limit = 1;  /* make limit a valid index in the array */
    if (arraykeyisempty(t, limit)) {  /* t[limit] empty? */
      /* there must be a border before 'limit' */
      unsigned i;
      /* look for a border in the vicinity of the hint */
      for (i = 0; i < maxvicinity && limit > 1; i++) {
        limit--;
        if (!arraykeyisempty(t, limit))
          return newhint(t, limit);  /* 'limit' is a border */
      }
      /* t[limit] still empty; search for a border in [0, limit) */
      return newhint(t, binsearch(t, 0, limit));
    }
    else {  /* 'limit' is present in table; look for a border after it */
      unsigned i;
      /* look for a border in the vicinity of the hint */
      for (i = 0; i < maxvicinity && limit < asize; i++) {
        limit++;
        if (arraykeyisempty(t, limit))
          return newhint(t, limit - 1);  /* 'limit - 1' is a border */
      }
      if (arraykeyisempty(t, asize)) {  /* last element empty? */
        /* t[limit] not empty; search for a border in [limit, asize) */
        return newhint(t, binsearch(t, limit, asize));
      }
    }
    /* last element non empty; set a hint to speed up finding that again */
    /* (keys in the hash part cannot be hints) */
    *lenhint(t) = asize;
  }
  /* no array part or t[asize] is not empty; check the hash part */
  lua_assert(asize == 0 || !arraykeyisempty(t, asize));
  if (isdummy(t) || hashkeyisempty(t, asize + 1))
    return asize;  /* 'asize + 1' is empty */
  else  /* 'asize + 1' is also non empty */
    return hash_search(L, t, asize);
}
```

:::

テーブルの配列部分には、値の並びと型タグの並びの間に `unsigned` が 1 つ置かれていて、それがヒントの置き場です。

<!-- source: ltable.h -->
```c:line-numbers=124
#define lenhint(t)	cast(unsigned*, (t)->array)
```

## 前提知識

- **配列部分**: Lua のテーブルは、`t[1]`, `t[2]`, … を番号順に詰めて置く配列部分と、それ以外を置くハッシュ部分を持ちます。`t->asize` は配列部分のマス数です。
- **ポインタと `*`**: `lenhint(t)` はヒントが置かれた場所を指すポインタです。`*lenhint(t)` と書くと、その場所の値を読み書きできます。
- **`arraykeyisempty(t, k)`**: 配列部分の k 番目（1 始まり）が空（nil）かを調べる小さな関数です。
- **`const unsigned maxvicinity = 4;`**: 書き換えない定数です。「近く」とみなす範囲を 4 マスに決めています。
- **二分探索**: 範囲を半分ずつに狭めて探す方法です。`binsearch(t, i, j)`は、`t[i]` があり `t[j]` が空という前提で、その間の境界を探します。

## 何をしているか

### 1. ヒントを取り出す

```c:line-numbers=1305
    unsigned limit = *lenhint(t);  /* start with the hint */
    if (limit == 0)
      limit = 1;  /* make limit a valid index in the array */
```

前回求めた長さ `limit` を読みます。0 は配列の添字として使えないので 1 にします。

### 2. ヒントの位置が空なら、手前を探す

```c:line-numbers=1308
    if (arraykeyisempty(t, limit)) {  /* t[limit] empty? */
      /* there must be a border before 'limit' */
      unsigned i;
      /* look for a border in the vicinity of the hint */
      for (i = 0; i < maxvicinity && limit > 1; i++) {
        limit--;
        if (!arraykeyisempty(t, limit))
          return newhint(t, limit);  /* 'limit' is a border */
      }
      /* t[limit] still empty; search for a border in [0, limit) */
      return newhint(t, binsearch(t, 0, limit));
    }
```

`t[limit]` が空なら、境界は limit より前にあります。まず 1 つずつ 4 回まで戻り、値のあるマスが見つかればそれが境界です。
たとえば前回 `#t` が 10 で、その後 `t[10] = nil` とした場合、`limit = 10` は空なので 1 つ戻って `t[9]` を見ると値があり、すぐ 9 を返します。
4 回戻っても見つからなければ、`binsearch(t, 0, limit)` で二分探索します。

### 3. ヒントの位置に値があれば、後ろを探す

```c:line-numbers=1320
    else {  /* 'limit' is present in table; look for a border after it */
      unsigned i;
      /* look for a border in the vicinity of the hint */
      for (i = 0; i < maxvicinity && limit < asize; i++) {
        limit++;
        if (arraykeyisempty(t, limit))
          return newhint(t, limit - 1);  /* 'limit - 1' is a border */
      }
      if (arraykeyisempty(t, asize)) {  /* last element empty? */
        /* t[limit] not empty; search for a border in [limit, asize) */
        return newhint(t, binsearch(t, limit, asize));
      }
```

逆に `t[limit]` に値があれば、境界はそれ以降です。4 マスまで進み、空のマスを見つけたら 1 つ手前を返します。
前回 10 で、`t[#t + 1] = v` として `t[11]` に追加した場合、`t[10]` に値があり、`t[11]` にも値、`t[12]` が空なので 11 を返します。
近くで見つからず、配列の最後のマスが空なら、`[limit, asize)` を二分探索します。

### 4. 配列が満杯ならハッシュ部分へ

```c:line-numbers=1335
    *lenhint(t) = asize;
  }
  /* no array part or t[asize] is not empty; check the hash part */
  lua_assert(asize == 0 || !arraykeyisempty(t, asize));
  if (isdummy(t) || hashkeyisempty(t, asize + 1))
    return asize;  /* 'asize + 1' is empty */
  else  /* 'asize + 1' is also non empty */
    return hash_search(L, t, asize);
```

配列の最後まで値が詰まっていたら、ヒントを `asize` にしておきます。そのうえで `t[asize + 1]` がハッシュ部分にあるかを調べ、なければ `asize` が答え、あれば `hash_search` でハッシュ部分から境界を探します。

## ここがすごい

- **典型パターンが O(1) になる**: `t[#t + 1] = v`（末尾に追加）や `t[#t] = nil`（末尾を削除）を繰り返すと、境界は 1 つずつしか動きません。毎回二分探索すると配列の大きさに応じて時間がかかりますが、ヒントの近くを数マス見るだけで済みます。
- **ヒントをタダで置く工夫**: ヒントは `Table` 構造体の項目ではなく、配列部分の中の値とタグの間に置かれています。配列部分のないテーブルではヒントも不要なので、すべてのテーブルにメモリを足さずに済みます（`ltable.h` のコメントより）。
- **「近く」は 4 マスに限定**: ヒントが外れた場合でも最悪 4 回の余計なチェックで二分探索に移るので、損は小さく抑えられています。
- **境界の定義をうまく使う**: 穴のあるテーブルでは境界が複数ありえますが、Lua の仕様は「どれか 1 つを返せばよい」としています。この自由があるからこそ、二分探索で見つかった境界をそのまま返せます。

## まとめ

- `#t` は「値のある n と空の n+1 の組」を探す処理で、二分探索で求められる。
- 前回の答えをヒントとして覚えると、少しずつ変わるデータに対する検索がとても速くなる。
- ヒントが外れたときの損を小さくする（近くは数マスだけ）設計が大事。
- 使う場面にだけ必要な情報は、その場面のデータの中に置くとメモリを節約できる。
