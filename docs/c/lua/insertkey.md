---
title: "居候を追い出せ。Lua のハッシュ表がキーを入れる「ブレントの方法」"
description: "Lua のテーブルにキーを追加する関数。衝突した相手が本来の位置にいないなら、相手を空き地へ引っ越させて自分が入る。チェーンを配列の中に埋め込んだ、すき間の少ないハッシュ表。"
language: c
project: Lua
repo: https://github.com/lua/lua
license: MIT
copyright: "Copyright (C) 1994-2026 Lua.org, PUC-Rio."
commit: "8cb93bada561977eb370819e39d7d644e5fd0a3f"
file: ltable.c
lines: [850, 894]
function: "insertkey"
difficulty: 3
format: 2
tags: [データ構造, ハッシュ, アルゴリズム, メモリ管理]
---

## ひとことで

`insertkey` は、Lua のテーブルのハッシュ部分に新しいキーと値を入れる関数です。
Lua のハッシュ表は、衝突（違うキーが同じ場所を指すこと）したキーをつなぐリストを、**別のメモリを確保せず、同じ配列の中のノード同士で** つないでいます。
そのうえで「衝突した相手が、本来の場所（メインポジション）にいない居候なら、相手を空き地に追い出して自分が入る」というルールで、各リストを短く保ちます。

## コード

::: code-group

```c:line-numbers=850 [日本語訳]
/*
** ハッシュ表に新しいキーを入れる。まず、キーのメインポジションが
** 空いているか確かめる。空いていなければ、衝突したノードが自分の
** メインポジションにいるかを確かめる。いなければ、衝突したノードを空き地に移し、
** 新しいキーをそのメインポジションに置く。そうでなければ（衝突したノードが
** 自分のメインポジションにいれば）、新しいキーが空き地に入る。
** キーを入れられなければ（空きが見つからなければ）0 を返す。
*/
static int insertkey (Table *t, const TValue *key, TValue *value) {
  Node *mp = mainpositionTV(t, key);
  /* テーブルにはまだそのキーがないはず */
  lua_assert(isabstkey(getgeneric(t, key, 0)));
  if (!isempty(gval(mp)) || isdummy(t)) {  /* メインポジションは使用中か？ */
    Node *othern;
    Node *f = getfreepos(t);  /* 空き地を得る */
    if (f == NULL)  /* 空き地が見つからない？ */
      return 0;
    lua_assert(!isdummy(t));
    othern = mainpositionfromnode(t, mp);
    if (othern != mp) {  /* 衝突したノードは自分のメインポジションの外にいるか？ */
      /* はい。衝突したノードを空き地へ移す */
      while (othern + gnext(othern) != mp)  /* 1 つ前を探す */
        othern += gnext(othern);
      gnext(othern) = cast_int(f - othern);  /* 'f' を指すようにつなぎ直す */
      *f = *mp;  /* 衝突したノードを空き地へコピー（mp->next も一緒に） */
      if (gnext(mp) != 0) {
        gnext(f) += cast_int(mp - f);  /* 'next' を補正 */
        gnext(mp) = 0;  /* これで 'mp' は空いた */
      }
      setempty(gval(mp));
    }
    else {  /* 衝突したノードは自分のメインポジションにいる */
      /* 新しいノードは空き地に入る */
      if (gnext(mp) != 0)
        gnext(f) = cast_int((mp + gnext(mp)) - f);  /* 新しい位置をつなぐ */
      else lua_assert(gnext(f) == 0);
      gnext(mp) = cast_int(f - mp);
      mp = f;
    }
  }
  setnodekey(mp, key);
  lua_assert(isempty(gval(mp)));
  setobj2t(cast(lua_State *, 0), gval(mp), value);
  return 1;
}
```

```c:line-numbers=850 [原文]
/*
** Inserts a new key into a hash table; first, check whether key's main
** position is free. If not, check whether colliding node is in its main
** position or not: if it is not, move colliding node to an empty place
** and put new key in its main position; otherwise (colliding node is in
** its main position), new key goes to an empty position. Return 0 if
** could not insert key (could not find a free space).
*/
static int insertkey (Table *t, const TValue *key, TValue *value) {
  Node *mp = mainpositionTV(t, key);
  /* table cannot already contain the key */
  lua_assert(isabstkey(getgeneric(t, key, 0)));
  if (!isempty(gval(mp)) || isdummy(t)) {  /* main position is taken? */
    Node *othern;
    Node *f = getfreepos(t);  /* get a free place */
    if (f == NULL)  /* cannot find a free place? */
      return 0;
    lua_assert(!isdummy(t));
    othern = mainpositionfromnode(t, mp);
    if (othern != mp) {  /* is colliding node out of its main position? */
      /* yes; move colliding node into free position */
      while (othern + gnext(othern) != mp)  /* find previous */
        othern += gnext(othern);
      gnext(othern) = cast_int(f - othern);  /* rechain to point to 'f' */
      *f = *mp;  /* copy colliding node into free pos. (mp->next also goes) */
      if (gnext(mp) != 0) {
        gnext(f) += cast_int(mp - f);  /* correct 'next' */
        gnext(mp) = 0;  /* now 'mp' is free */
      }
      setempty(gval(mp));
    }
    else {  /* colliding node is in its own main position */
      /* new node will go into free position */
      if (gnext(mp) != 0)
        gnext(f) = cast_int((mp + gnext(mp)) - f);  /* chain new position */
      else lua_assert(gnext(f) == 0);
      gnext(mp) = cast_int(f - mp);
      mp = f;
    }
  }
  setnodekey(mp, key);
  lua_assert(isempty(gval(mp)));
  setobj2t(cast(lua_State *, 0), gval(mp), value);
  return 1;
}
```

:::

## 前提知識

- **ノード（`Node`）**: ハッシュ表の 1 マスで、キー・値・`next` を持ちます。`next` は「同じリストの次のノードが、配列の中で何マス先にあるか」という **相対的な距離** です（0 なら終わり）。
- **メインポジション**: キーのハッシュ値から計算される、そのキーが本来入るべきマスです。`mainpositionTV(t, key)` で求めます。
- **ポインタの演算**: `Node *mp` はノードを指すポインタです。`othern + gnext(othern)` のように整数を足すと、その数だけ先のノードを指します。`f - othern` のように引くと、2 つの間に何マスあるかがわかります。
- **`*f = *mp;`**: ポインタの指す中身（構造体まるごと）をコピーします。
- **マクロ**: `gnext(n)` はノードの `next`、`gval(n)` は値の部分です。`isempty` は値が空か、`setempty` は空にする、`setnodekey` はキーを書き込む、という意味のマクロです。
- **`lua_assert`**: デバッグ時だけ条件を確かめる仕組みで、通常のビルドでは何もしません。

## 何をしているか

### 1. メインポジションが空いていれば、そこに入る

```c:line-numbers=859
  Node *mp = mainpositionTV(t, key);
  /* table cannot already contain the key */
  lua_assert(isabstkey(getgeneric(t, key, 0)));
  if (!isempty(gval(mp)) || isdummy(t)) {  /* main position is taken? */
    Node *othern;
    Node *f = getfreepos(t);  /* get a free place */
    if (f == NULL)  /* cannot find a free place? */
      return 0;
    lua_assert(!isdummy(t));
    othern = mainpositionfromnode(t, mp);
    if (othern != mp) {  /* is colliding node out of its main position? */
      /* yes; move colliding node into free position */
      while (othern + gnext(othern) != mp)  /* find previous */
        othern += gnext(othern);
      gnext(othern) = cast_int(f - othern);  /* rechain to point to 'f' */
      *f = *mp;  /* copy colliding node into free pos. (mp->next also goes) */
      if (gnext(mp) != 0) {
        gnext(f) += cast_int(mp - f);  /* correct 'next' */
        gnext(mp) = 0;  /* now 'mp' is free */
      }
      setempty(gval(mp));
    }
    else {  /* colliding node is in its own main position */
      /* new node will go into free position */
      if (gnext(mp) != 0)
        gnext(f) = cast_int((mp + gnext(mp)) - f);  /* chain new position */
      else lua_assert(gnext(f) == 0);
      gnext(mp) = cast_int(f - mp);
      mp = f;
    }
  }
  setnodekey(mp, key);
  lua_assert(isempty(gval(mp)));
  setobj2t(cast(lua_State *, 0), gval(mp), value);
  return 1;
```

ハッシュ値からメインポジション `mp` を求め、そこが空なら最後の `setnodekey` へ進み、キーと値を書き込んで終わりです。
`isdummy(t)` は、ハッシュ部分を持たないテーブルが共有している「ダミーのノード」を指しているかの確認で、その場合は書き込めません。

### 2. 空き地を探す

```c:line-numbers=864
    Node *f = getfreepos(t);  /* get a free place */
    if (f == NULL)  /* cannot find a free place? */
      return 0;
```

`mp` が埋まっていたら、まず `getfreepos` で空いているノード `f` を探します。見つからなければ 0 を返し、呼び出し元がテーブルを大きくします（リハッシュ）。

### 3. 相手が居候なら追い出す

```c:line-numbers=868
    othern = mainpositionfromnode(t, mp);
    if (othern != mp) {  /* is colliding node out of its main position? */
      /* yes; move colliding node into free position */
      while (othern + gnext(othern) != mp)  /* find previous */
        othern += gnext(othern);
      gnext(othern) = cast_int(f - othern);  /* rechain to point to 'f' */
      *f = *mp;  /* copy colliding node into free pos. (mp->next also goes) */
      if (gnext(mp) != 0) {
        gnext(f) += cast_int(mp - f);  /* correct 'next' */
        gnext(mp) = 0;  /* now 'mp' is free */
      }
      setempty(gval(mp));
    }
```

`mp` にいるノードの本来の場所 `othern` を計算します。`othern != mp` なら、その相手は別のキーとの衝突で押し出されてここに来た居候です。
- `while` ループ: 相手のリストをたどって、`mp` の 1 つ手前のノードを見つけます。
- `gnext(othern) = cast_int(f - othern)`: 手前のノードの `next` を、引っ越し先 `f` を指すように書き換えます。
- `*f = *mp` とその後: `mp` の中身を `f` にコピーします。`next` は相対距離なので、場所が変わったぶん `mp - f` を足して補正します。
- `setempty(gval(mp))`: `mp` を空にして、新しいキーの場所にします。

### 4. 相手が本来の住人なら、自分が空き地に行く

```c:line-numbers=881
    else {  /* colliding node is in its own main position */
      /* new node will go into free position */
      if (gnext(mp) != 0)
        gnext(f) = cast_int((mp + gnext(mp)) - f);  /* chain new position */
      else lua_assert(gnext(f) == 0);
      gnext(mp) = cast_int(f - mp);
      mp = f;
    }
```

相手がちょうど自分のメインポジションにいるなら、相手は正当な住人です。新しいキーは空き地 `f` に入り、`mp` のリストの 2 番目に差し込みます。`gnext(f) = cast_int((mp + gnext(mp)) - f)` で `f` の次を「もとの 2 番目」に、`gnext(mp) = cast_int(f - mp)` で `mp` の次を `f` にしています。

## ここがすごい

- **ポインタを使わずリストを作る**: ふつうのチェーン法（衝突したキーを連結リストでつなぐ方法）は、キーを追加するたびに小さなメモリを確保します。Lua はノードの配列の中だけで完結するので、メモリ確保が不要で、データもまとまって置かれます。
- **相対距離の `next`**: 次のノードを「アドレス」ではなく「何マス先か」で持つので、ノードを別の場所へコピーしても、距離を足し引きするだけで直せます。ポインタより小さい `int` で済むのも利点です。
- **リストが混ざらない**: 「本来の場所にいるキーは決して追い出されない」というルールのおかげで、各リストの先頭は必ず自分のメインポジションに置かれます。そのため検索は「メインポジションからリストをたどる」だけで済み、別のキーのリストに迷い込みません。これは Brent の方法と呼ばれる考え方の変形で、ltable.c 冒頭のコメントでも触れられています。
- **満杯の扱いを呼び出し元に任せる**: 空き地がなければ 0 を返すだけにして、テーブルを大きくする処理（`rehash`）と分けています。この関数自体はメモリ確保も失敗もしないので単純です。

## まとめ

- オープンアドレス法とチェーン法のよいとこ取りで、配列の中にリストを埋め込める。
- 「本来の場所にいる者は動かさず、居候は追い出す」というルールで、検索の手間を小さく保つ。
- 位置を相対距離で持つと、要素を移動しても修正が簡単になる。
- 失敗しうる処理（メモリ確保）を外に出すと、中心の処理が単純で安全になる。
