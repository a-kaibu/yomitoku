---
title: "倍々で飛んでから二分探索。乱数で攻撃をかわす長さの探索"
description: "テーブルの長さ #t の境界がハッシュ部分にあるときの探索。キーを倍々にして「空のキー」を見つけ、そこから二分探索する。最初の一歩に乱数を混ぜて、意地悪な入力に備える。"
language: c
project: Lua
repo: https://github.com/lua/lua
license: MIT
copyright: "Copyright (C) 1994-2026 Lua.org, PUC-Rio."
commit: "8cb93bada561977eb370819e39d7d644e5fd0a3f"
file: ltable.c
lines: [1221, 1268]
function: "hash_search"
difficulty: 3
format: 2
tags: [探索, アルゴリズム, セキュリティ, 乱数]
---

## ひとことで

Lua の `#t`（テーブルの長さ）は、「`t[i]` に値があり `t[i+1]` が空」となる **境界** i を探して返します。
配列部分が満杯で、境界がハッシュ部分（番号順に並んでいない部分）にあるときに呼ばれるのが `hash_search` です。
**キーを 2 倍ずつ大きくしながら空のキーを見つけ、見つかったら二分探索する** という、上限がわからない範囲を探す定番の方法（指数探索）を使っています。

## コード

::: code-group

```c:line-numbers=1221 [日本語訳]
/*
** テーブル 't' のハッシュ部分で境界を探す。呼び出し元から、
** 'asize + 1' があることはわかっている。もっと大きく、テーブルにない
** キーを見つけたい。そうすれば 2 つのキーの間で二分探索して
** 境界を見つけられる。ない添字に当たるまで 'j' を
** 2 倍し続ける。2 倍であふれそうなら
** LUA_MAXINTEGER を試す。それがなければ二分探索の準備ができた。
** （'j' は最大の整数なので 'i' 以上だが、等しくはなりえない。
** 'j' はなく 'i' はあるから。）そうでなければ 'j' が
** 境界である。（'j + 1' は Lua の有効な整数ではないので、
** 存在する整数キーにはなりえない。）
** 'rnd' について: 決まった手順を使うと、悪意のある者が
** 調べられるキーだけでテーブルを埋め、
** 小さなテーブルが巨大な長さになるようにできてしまう。それを避けるため、
** 状態の種を乱数源として使う。最初の調査では、
** 'i' にその幅くらいの乱数を足して
** 「ランダムに 2 倍」する。
*/
static lua_Unsigned hash_search (lua_State *L, Table *t, unsigned asize) {
  lua_Unsigned i = asize + 1;  /* t[i] があることは呼び出し元が保証 */
  unsigned rnd = G(L)->seed;
  int n = (asize > 0) ? luaO_ceillog2(asize) : 0;  /* 'asize' の幅 */
  unsigned mask = (1u << n) - 1;  /* 'asize' の幅だけ 1 が並んだ 11...111 */
  unsigned incr = (rnd & mask) + 1;  /* 最初の増分（1 以上） */
  lua_Unsigned j = (incr <= l_castS2U(LUA_MAXINTEGER) - i) ? i + incr : i + 1;
  rnd >>= n;  /* 'rnd' から 'n' ビット使った */
  while (!hashkeyisempty(t, j)) {  /* t[j] がなくなるまで繰り返す */
    i = j;  /* 'i' は存在する添字 */
    if (j <= l_castS2U(LUA_MAXINTEGER)/2 - 1) {
      j = j*2 + (rnd & 1);  /* 2j か 2j+1 でもう一度 */
      rnd >>= 1;
    }
    else {
      j = LUA_MAXINTEGER;
      if (hashkeyisempty(t, j))  /* t[j] はないか？ */
        break;  /* これで 'j' はない添字 */
      else  /* 変なケース */
        return j;  /* まあ、最大の整数が境界ということ… */
    }
  }
  /* i < j かつ t[i] があり t[j] がない */
  while (j - i > 1u) {  /* その間で二分探索する */
    lua_Unsigned m = (i + j) / 2;
    if (hashkeyisempty(t, m)) j = m;
    else i = m;
  }
  return i;
}
```

```c:line-numbers=1221 [原文]
/*
** Try to find a boundary in the hash part of table 't'. From the
** caller, we know that 'asize + 1' is present. We want to find a larger
** key that is absent from the table, so that we can do a binary search
** between the two keys to find a boundary. We keep doubling 'j' until
** we get an absent index.  If the doubling would overflow, we try
** LUA_MAXINTEGER. If it is absent, we are ready for the binary search.
** ('j', being max integer, is larger or equal to 'i', but it cannot be
** equal because it is absent while 'i' is present.) Otherwise, 'j' is a
** boundary. ('j + 1' cannot be a present integer key because it is not
** a valid integer in Lua.)
** About 'rnd': If we used a fixed algorithm, a bad actor could fill
** a table with only the keys that would be probed, in such a way that
** a small table could result in a huge length. To avoid that, we use
** the state's seed as a source of randomness. For the first probe,
** we "randomly double" 'i' by adding to it a random number roughly its
** width.
*/
static lua_Unsigned hash_search (lua_State *L, Table *t, unsigned asize) {
  lua_Unsigned i = asize + 1;  /* caller ensures t[i] is present */
  unsigned rnd = G(L)->seed;
  int n = (asize > 0) ? luaO_ceillog2(asize) : 0;  /* width of 'asize' */
  unsigned mask = (1u << n) - 1;  /* 11...111 with the width of 'asize' */
  unsigned incr = (rnd & mask) + 1;  /* first increment (at least 1) */
  lua_Unsigned j = (incr <= l_castS2U(LUA_MAXINTEGER) - i) ? i + incr : i + 1;
  rnd >>= n;  /* used 'n' bits from 'rnd' */
  while (!hashkeyisempty(t, j)) {  /* repeat until an absent t[j] */
    i = j;  /* 'i' is a present index */
    if (j <= l_castS2U(LUA_MAXINTEGER)/2 - 1) {
      j = j*2 + (rnd & 1);  /* try again with 2j or 2j+1 */
      rnd >>= 1;
    }
    else {
      j = LUA_MAXINTEGER;
      if (hashkeyisempty(t, j))  /* t[j] not present? */
        break;  /* 'j' now is an absent index */
      else  /* weird case */
        return j;  /* well, max integer is a boundary... */
    }
  }
  /* i < j  &&  t[i] present  &&  t[j] absent */
  while (j - i > 1u) {  /* do a binary search between them */
    lua_Unsigned m = (i + j) / 2;
    if (hashkeyisempty(t, m)) j = m;
    else i = m;
  }
  return i;
}
```

:::

## 前提知識

- **`lua_Unsigned`**: Lua の整数と同じ幅（ふつう 64 ビット）の符号なし整数型です。
- **`LUA_MAXINTEGER`**: Lua の整数の最大値です。`l_castS2U` は符号付きの整数を符号なしに変換するマクロです。
- **`hashkeyisempty(t, k)`**: 整数キー k がハッシュ部分になければ真を返す関数です。
- **ビットマスク**: `(1u << n) - 1` は下位 n ビットがすべて 1 の数です。n = 3 なら `0b111` = 7。`rnd & mask` で乱数の下位 n ビットだけを取り出せます。`1u` の `u` は「符号なしの 1」という意味です。
- **`G(L)->seed`**: Lua の状態（`lua_State`）が持つ、起動ごとに決まる乱数の種です。`->` はポインタが指す構造体の項目を読む書き方です。
- **`luaO_ceillog2(x)`**: x 以上の最小の 2 のべき乗が 2 の何乗かを返します。ここでは asize の 2 進数の「幅」として使っています。

## 何をしているか

### 1. 出発点

```c:line-numbers=1240
  lua_Unsigned i = asize + 1;  /* caller ensures t[i] is present */
  unsigned rnd = G(L)->seed;
  int n = (asize > 0) ? luaO_ceillog2(asize) : 0;  /* width of 'asize' */
  unsigned mask = (1u << n) - 1;  /* 11...111 with the width of 'asize' */
  unsigned incr = (rnd & mask) + 1;  /* first increment (at least 1) */
  lua_Unsigned j = (incr <= l_castS2U(LUA_MAXINTEGER) - i) ? i + incr : i + 1;
  rnd >>= n;  /* used 'n' bits from 'rnd' */
```

呼び出し元が確認済みなので、`t[asize + 1]` には値があります。これを `i` にします。
次に調べる `j` は、`i` に「asize と同じくらいの幅の乱数 + 1」を足した位置です。asize = 8 なら n = 3、mask = 7 で、incr は 1〜8 のどれかになります。足すと最大値を超えてしまう場合は `i + 1` にします。
使った n ビットぶん、`rnd` を右にずらして捨てます。

### 2. 倍々に飛ぶ

```c:line-numbers=1247
  while (!hashkeyisempty(t, j)) {  /* repeat until an absent t[j] */
    i = j;  /* 'i' is a present index */
    if (j <= l_castS2U(LUA_MAXINTEGER)/2 - 1) {
      j = j*2 + (rnd & 1);  /* try again with 2j or 2j+1 */
      rnd >>= 1;
    }
    else {
      j = LUA_MAXINTEGER;
      if (hashkeyisempty(t, j))  /* t[j] not present? */
        break;  /* 'j' now is an absent index */
      else  /* weird case */
        return j;  /* well, max integer is a boundary... */
    }
  }
```

`t[j]` に値がある間、`i = j` として、`j` を `2j` または `2j + 1` にします。どちらになるかは乱数の 1 ビットで決めます。
キー 1〜100 に値があるテーブル（asize = 0）なら、乱数次第ですが、たとえば j = 1, 2, 4, 9, 18, 37, 75, 150 と進み、`t[150]` が空になったところで止まります。このとき i = 75 です。
`j` を 2 倍するとあふれそうになったら、最大値 `LUA_MAXINTEGER` そのものを試します。それも値があれば、最大値自体が境界なのでそれを返します（コメントでは「weird case」）。

### 3. 二分探索

```c:line-numbers=1262
  while (j - i > 1u) {  /* do a binary search between them */
    lua_Unsigned m = (i + j) / 2;
    if (hashkeyisempty(t, m)) j = m;
    else i = m;
  }
  return i;
```

ここで「`t[i]` に値があり、`t[j]` は空」が成り立っています。中間 `m` を調べ、空なら `j = m`、値があれば `i = m` として幅を半分にしていきます。幅が 1 になったとき、`i` が境界です。先の例なら 75 と 150 の間を絞り込み、100 にたどり着きます。

## ここがすごい

- **上限がわからなくても対数時間**: 境界がどこにあるか見当がつかないとき、1 つずつ数えると長さに比例した時間がかかります。倍々に飛べば、長さ N に対して約 log₂N 回で「空のキー」に届き、その後の二分探索も約 log₂N 回です。
- **乱数で攻撃をかわす**: 関数の上のコメントが理由を説明しています。もし必ず 1, 2, 4, 8, … と調べるなら、悪意のある人は「調べられる位置だけ」にキーを入れた小さなテーブルを作れます。すると、要素がわずかなのに `#t` がとても大きな値を返します。調べる位置に乱数を混ぜると、どこを調べるか予想できなくなり、この手口が使えません。
- **あふれへの丁寧な対処**: `incr <= l_castS2U(LUA_MAXINTEGER) - i` と `j <= l_castS2U(LUA_MAXINTEGER)/2 - 1` の 2 か所で、足し算や 2 倍が整数の最大値を超えないかを先に確かめています。超えそうなら最大値を直接調べ、「最大値の次の整数はない」という事実から、それを境界としてよいと判断しています。
- **乱数を節約して使う**: 1 回の種から、最初の一歩で n ビット、その後は 1 ステップ 1 ビットずつ取り出して使っています。乱数を何度も生成するコストがかかりません。

## まとめ

- 終わりのわからない範囲は「倍々に広げてから二分探索」（指数探索）で効率よく探せる。
- 決まった手順の探索は、入力を作る側に悪用されることがある。乱数を少し混ぜるだけで防げる場合がある。
- 2 倍や足し算の前に、あふれないかを確かめる習慣が大切。
- 1 つの乱数をビットごとに切り分けて使うと、乱数生成の回数を減らせる。
