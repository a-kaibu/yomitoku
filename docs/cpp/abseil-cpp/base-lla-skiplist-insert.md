---
title: 空きブロックをスキップリストで管理する低レベルアロケータ
description: malloc を使えない場面のためのメモリアロケータの内部。空きブロックのリストをアドレス順のスキップリストにして、探索と挿入を平均 O(log n) にする。
language: cpp
project: Abseil
repo: https://github.com/abseil/abseil-cpp
license: Apache-2.0
commit: "4ce33a3b8a55d727ccb50d4134f869d1689039f2"
format: 2
copyright: Copyright 2017 The Abseil Authors.
file: absl/base/internal/low_level_alloc.cc
lines: [161, 189]
function: LLA_SkiplistInsert
difficulty: 3
tags: [データ構造, メモリ管理, アルゴリズム]
---

## ひとことで

`LowLevelAlloc` は、`malloc` を使えない低レベルな場面（シグナルハンドラの中など）のための、Abseil 内部のメモリアロケータです。
解放されたメモリブロック（空きブロック）は **アドレス順に並べたスキップリスト** で管理します。ここで読むのは、そのリストを探す `LLA_SkiplistSearch` と、ブロックを差し込む `LLA_SkiplistInsert` です。

## コード

::: code-group

```cpp:line-numbers=161 [日本語訳]
// AllocList *head のうち *atleast >= *e となる最初の要素 "atleast" を返す。
// 0 <= i < head->levels について、prev[i] に "no_greater" を入れる。no_greater は
// 段 i で *e より小さい最後の要素を指す。そのような要素がなければ
// head を指す。
static AllocList *LLA_SkiplistSearch(AllocList *head, AllocList *e,
                                     AllocList **prev) {
  AllocList *p = head;
  for (int level = head->levels - 1; level >= 0; level--) {
    for (AllocList *n; (n = p->next[level]) != nullptr && n < e; p = n) {
    }
    prev[level] = p;
  }
  return (head->levels == 0) ? nullptr : prev[0]->next[0];
}

// 要素 *e を AllocList *head に挿入する。prev[] は LLA_SkiplistSearch と同様に設定する。
// e->levels は、呼び出し元があらかじめ設定しておく必要がある（
// LLA_SkiplistLevels() を使う）
static void LLA_SkiplistInsert(AllocList *head, AllocList *e,
                               AllocList **prev) {
  LLA_SkiplistSearch(head, e, prev);
  for (; head->levels < e->levels; head->levels++) {  // prev ポインタを
    prev[head->levels] = head;                        // *e のすべての段まで広げる
  }
  for (int i = 0; i != e->levels; i++) {  // 要素をリストに追加
    e->next[i] = prev[i]->next[i];
    prev[i]->next[i] = e;
  }
}
```

```cpp:line-numbers=161 [原文]
// Return "atleast", the first element of AllocList *head s.t. *atleast >= *e.
// For 0 <= i < head->levels, set prev[i] to "no_greater", where no_greater
// points to the last element at level i in the AllocList less than *e, or is
// head if no such element exists.
static AllocList *LLA_SkiplistSearch(AllocList *head, AllocList *e,
                                     AllocList **prev) {
  AllocList *p = head;
  for (int level = head->levels - 1; level >= 0; level--) {
    for (AllocList *n; (n = p->next[level]) != nullptr && n < e; p = n) {
    }
    prev[level] = p;
  }
  return (head->levels == 0) ? nullptr : prev[0]->next[0];
}

// Insert element *e into AllocList *head.  Set prev[] as LLA_SkiplistSearch.
// Requires that e->levels be previously set by the caller (using
// LLA_SkiplistLevels())
static void LLA_SkiplistInsert(AllocList *head, AllocList *e,
                               AllocList **prev) {
  LLA_SkiplistSearch(head, e, prev);
  for (; head->levels < e->levels; head->levels++) {  // extend prev pointers
    prev[head->levels] = head;                        // to all *e's levels
  }
  for (int i = 0; i != e->levels; i++) {  // add element to list
    e->next[i] = prev[i]->next[i];
    prev[i]->next[i] = e;
  }
}
```

:::

## 前提知識

- **スキップリスト**: 連結リストに「急行」の線を何段か重ねたデータ構造です。いちばん下の段はすべての要素をつなぎ、上の段ほど要素を飛ばしてつなぎます。上の段で大きく進み、行き過ぎそうになったら下の段に降りることで、探索が平均 O(log n) になります。
- **`AllocList`**: 1 つのメモリブロックを表す構造体です。`levels` は自分が参加している段の数、`next[i]` は i 段目での次の要素へのポインタです（同じファイルの上のほうで定義）。
- **`head`**: リストの先頭を表す番兵（ダミーの要素）です。`head->levels` は、今リスト全体で使われている段の数です。
- **ポインタの比較 `n < e`**: ポインタ同士の `<` はアドレスの大小を比べます。ここではブロックをアドレス順に並べるのに使います。
- **`AllocList **prev`**: 「ポインタの配列」を受け取る引数です。各段で「どの要素の後ろに差し込むか」を記録して、呼び出し元に返します。
- **空の本体を持つ `for`**: `for (…; 条件; p = n) {}` は、条件が成り立つ間 `p` を進めるだけのループです。

## 何をしているか

### 1. 探索

```cpp:line-numbers=165
static AllocList *LLA_SkiplistSearch(AllocList *head, AllocList *e,
                                     AllocList **prev) {
  AllocList *p = head;
  for (int level = head->levels - 1; level >= 0; level--) {
    for (AllocList *n; (n = p->next[level]) != nullptr && n < e; p = n) {
    }
    prev[level] = p;
  }
  return (head->levels == 0) ? nullptr : prev[0]->next[0];
}
```

上の段から順に、`e` より小さいアドレスの要素をたどれるだけたどります。行き止まりになったら、その段で最後にいた要素を `prev[level]` に記録し、1 段下に降ります。

アドレス `10, 30, 50, 70` の 4 ブロックがあり、`30` と `70` だけが 2 段目にも参加しているとします。`e = 60` を探すと次のようになります。

- 2 段目: `head → 30`（30 < 60 なので進む）→ 次は `70`（60 以上なので止まる）。`prev[1] = 30`。
- 1 段目: `30` から始めて `50` へ進む → 次は `70` なので止まる。`prev[0] = 50`。

戻り値は `prev[0]->next[0]`、つまり `e` 以上で最初のブロック `70` です。

### 2. 段を増やす

```cpp:line-numbers=182
  for (; head->levels < e->levels; head->levels++) {  // prev ポインタを
    prev[head->levels] = head;                        // *e のすべての段まで広げる
  }
```

挿入する `e` の段数が、今のリスト全体の段数より多いことがあります。その場合は、新しい段の `prev` を `head` にして、リストの段数を増やします。新しい段にはまだ誰もいないので、`head` の直後に入れればよいわけです。

### 3. 各段に差し込む

```cpp:line-numbers=185
  for (int i = 0; i != e->levels; i++) {  // 要素をリストに追加
    e->next[i] = prev[i]->next[i];
    prev[i]->next[i] = e;
  }
```

普通の連結リストへの挿入を、`e` が参加する段の数だけ繰り返します。

- `e->next[i] = prev[i]->next[i];`（`e` の次を、`prev` の元の次にする）
- `prev[i]->next[i] = e;`（`prev` の次を `e` にする）

先ほどの例で `e = 60` が 2 段なら、1 段目は `50 → 60 → 70`、2 段目は `30 → 60 → 70` になります。

## ここがすごい

- **アドレス順に並べる理由**: ブロックをアドレス順に保つと、解放されたブロックの **前後の隣人** がすぐ分かります。隣り合う空きブロックをくっつけて大きな 1 つにする処理（結合）がしやすくなり、メモリの細切れ化を防げます。ファイル中のコメントも「アドレス順を保ちつつ、挿入と削除を対数時間で」と目的を書いています。
- **木より単純**: 平衡二分探索木でも同じことができますが、回転などの複雑な処理が必要です。スキップリストは「段ごとの連結リスト」なので、探索も挿入もこのとおり数行で書けます。
- **探索結果を挿入・削除で使い回す**: `LLA_SkiplistSearch` は答えだけでなく `prev` 配列も返します。挿入（`LLA_SkiplistInsert`）も削除（`LLA_SkiplistDelete`）もこの `prev` を使って各段をつなぎ替えるので、同じ探索ロジックを 1 か所にまとめられています。
- **ブロックの中にリストを埋め込む**: `next` 配列は空きブロックそのものの中に置かれます。空いているメモリを管理情報の置き場にするので、別に管理用のメモリを確保する必要がありません。

## まとめ

- スキップリストは「段を重ねた連結リスト」で、探索・挿入・削除が平均 O(log n) になる。
- 探索中に各段の直前の要素を記録しておけば、挿入も削除もその記録でつなぎ替えるだけで済む。
- 空きブロックをアドレス順に保つと、隣接ブロックの結合がしやすくなる。
- アロケータは空きメモリ自体に管理情報を埋め込むことで、追加のメモリを使わずに済む。
