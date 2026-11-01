---
title: "配列にするか、ハッシュにするか。メモリで決める最適サイズ計算"
description: "Lua のテーブルは「配列部分」と「ハッシュ部分」の 2 つを持つ。整数キーを 2 のべき乗ごとに数えた表から、配列部分の最適な大きさを 1 本のループで決める。"
language: c
project: Lua
repo: https://github.com/lua/lua
license: MIT
copyright: "Copyright (C) 1994-2026 Lua.org, PUC-Rio."
commit: "8cb93bada561977eb370819e39d7d644e5fd0a3f"
file: ltable.c
lines: [437, 467]
function: "computesizes"
difficulty: 2
format: 2
tags: [データ構造, アルゴリズム, メモリ管理, 最適化]
---

## ひとことで

Lua のテーブル（`{}` で作る連想配列）は、内部に **配列部分**（`t[1]`, `t[2]`… を番号順に詰めて置く場所）と **ハッシュ部分**（それ以外のキーを置く場所）を持っています。
`computesizes` は、テーブルを作り直すとき（リハッシュ）に「配列部分を何マスにすれば一番得か」を計算する関数です。
たとえばキーが 1, 2, 3, 100 なら、配列部分は 4 マス（1〜4）にし、100 はハッシュ部分に置く、という判断をします。

## コード

::: code-group

```c:line-numbers=437 [日本語訳]
/*
** テーブル 't' の配列部分の最適な大きさを計算する。
** この大きさは、配列部分に入る要素数を最大にしつつ、
** 全要素をハッシュ部分に入れた場合のメモリ使用量に対して
** 条件 'arrayXhash' を満たすものである。
** 'ct->na' は、入るときはテーブル内の配列向き添字の総数で、
** 出るときは配列部分に入るキーの数になる。
** 配列部分の最適な大きさを返す。
*/
static unsigned computesizes (Counters *ct) {
  int i;
  unsigned int twotoi;  /* 2^i（最適な大きさの候補） */
  unsigned int a = 0;  /* 2^i 以下の要素の数 */
  unsigned int na = 0;  /* 配列部分に入る要素の数 */
  unsigned int optimal = 0;  /* 配列部分の最適な大きさ */
  /* 'twotoi' があふれず、配列向き添字の総数がまだ
     その配列の大きさに対して 'arrayXhash' を満たしうる間、区間をたどる */
  for (i = 0, twotoi = 1;
       twotoi > 0 && arrayXhash(twotoi, ct->na);
       i++, twotoi *= 2) {
    unsigned nums = ct->nums[i];
    a += nums;
    if (nums > 0 &&  /* 要素が増えるときだけ配列を広げる… */
        arrayXhash(twotoi, a)) {  /* …しかも「メモリが少なくて済む」ときだけ */
      optimal = twotoi;  /* （今のところの）最適な大きさ */
      na = a;  /* 'optimal' までの全要素が配列部分に入る */
    }
  }
  ct->na = na;
  return optimal;
}
```

```c:line-numbers=437 [原文]
/*
** Compute the optimal size for the array part of table 't'.
** This size maximizes the number of elements going to the array part
** while satisfying the condition 'arrayXhash' with the use of memory if
** all those elements went to the hash part.
** 'ct->na' enters with the total number of array indices in the table
** and leaves with the number of keys that will go to the array part;
** return the optimal size for the array part.
*/
static unsigned computesizes (Counters *ct) {
  int i;
  unsigned int twotoi;  /* 2^i (candidate for optimal size) */
  unsigned int a = 0;  /* number of elements smaller than 2^i */
  unsigned int na = 0;  /* number of elements to go to array part */
  unsigned int optimal = 0;  /* optimal size for array part */
  /* traverse slices while 'twotoi' does not overflow and total of array
     indices still can satisfy 'arrayXhash' against the array size */
  for (i = 0, twotoi = 1;
       twotoi > 0 && arrayXhash(twotoi, ct->na);
       i++, twotoi *= 2) {
    unsigned nums = ct->nums[i];
    a += nums;
    if (nums > 0 &&  /* grows array only if it gets more elements... */
        arrayXhash(twotoi, a)) {  /* ...while using "less memory" */
      optimal = twotoi;  /* optimal size (till now) */
      na = a;  /* all elements up to 'optimal' will go to array part */
    }
  }
  ct->na = na;
  return optimal;
}
```

:::

同じファイルにある、数を数える構造体と判定マクロの定義です。

```c:line-numbers=421
typedef struct {
  unsigned total;
  unsigned na;
  int deleted;
  unsigned nums[MAXABITS + 1];
} Counters;
```

```c:line-numbers=435
#define arrayXhash(na,nh)	(cast_sizet(na) <= cast_sizet(nh) * 3)
```

## 前提知識

- **`struct`（構造体）**: 複数の値をひとまとめにした型です。`Counters` は「数えた結果」を入れる箱です。
- **ポインタと `->`**: `Counters *ct` は「Counters がある場所（アドレス）」を受け取る引数です。`ct->na` は「ct が指す構造体の `na` という項目」を意味します。ポインタで渡すので、関数の中で書き換えた値が呼び出し元にも残ります。
- **`nums[i]`**: 構造体の上のコメントによると、`nums[i]` は 2^(i−1) + 1 から 2^i までの整数キーの個数です。`nums[0]` はキー 1、`nums[1]` はキー 2、`nums[2]` はキー 3〜4、`nums[3]` はキー 5〜8 の個数です。
- **マクロ `arrayXhash(na, nh)`**: 「`na` マスの配列を使うほうが、`nh` 個をハッシュに入れるより得か」を判定します。ハッシュの 1 ノードは配列の 1 マスのおよそ 3 倍のメモリを使う（キーと値と次へのリンクを持つ）ので、`na <= nh * 3` なら配列のほうが得、という目安です。`cast_sizet` は `size_t`（大きな符号なし整数）に変換して、掛け算のあふれを防ぎます。
- **`for (A, B; 条件; C, D)`**: カンマで区切ると、初期化や更新で 2 つの変数を同時に扱えます。

## 何をしているか

### 1. 候補は 2 のべき乗だけ

```c:line-numbers=454
  for (i = 0, twotoi = 1;
       twotoi > 0 && arrayXhash(twotoi, ct->na);
       i++, twotoi *= 2) {
```

配列部分の大きさは 1, 2, 4, 8, … のどれかにします。`twotoi` がその候補で、ループのたびに 2 倍になります。
ループを続ける条件は 2 つです。`twotoi > 0` は 2 倍し続けてあふれて 0 になったら止める、という安全装置です。`arrayXhash(twotoi, ct->na)` は「テーブル内の配列向きキーを全部集めても、この大きさの配列を正当化できないなら、もっと大きい候補は考えるだけ無駄」という打ち切りです。

### 2. 累積しながら判定

```c:line-numbers=457
    unsigned nums = ct->nums[i];
    a += nums;
    if (nums > 0 &&  /* grows array only if it gets more elements... */
        arrayXhash(twotoi, a)) {  /* ...while using "less memory" */
      optimal = twotoi;  /* optimal size (till now) */
      na = a;  /* all elements up to 'optimal' will go to array part */
    }
```

`a` は「`twotoi` 以下のキーの個数」の累計です。`nums[i]` を足していくだけで求まります。
`nums > 0`（この区間で新しくキーが増えた）かつ `arrayXhash(twotoi, a)`（`twotoi` マスに `a` 個入るなら損しない）なら、いまの `twotoi` を最適候補として記録します。

### 3. 具体例

キーが 1, 2, 3, 100 のとき、`nums[0]=1`, `nums[1]=1`, `nums[2]=1`, `nums[7]=1`、`ct->na = 4` です。
- i=0（候補 1）: a=1。1 ≤ 3 なので optimal=1。
- i=1（候補 2）: a=2。2 ≤ 6 なので optimal=2。
- i=2（候補 4）: a=3。4 ≤ 9 なので optimal=4。
- i=3（候補 8）: 8 ≤ 12 なのでループは続くが、nums[3]=0 なので更新しない。
- i=4（候補 16）: 16 ≤ 12 が偽なのでループ終了。

結果は 4 マスで、`ct->na` には配列に入る個数 3 が書き戻されます。キー 100 のために 128 マスを確保する、という無駄は起きません。

## ここがすごい

- **キーを並べ替えない**: 素直に考えると「キーを小さい順に並べて、各大きさで何個入るかを数える」必要があります。ここでは事前に 2 のべき乗の区間ごとに数えた `nums` があるので、最大でも 32 回程度のループで答えが出ます。
- **「最大の候補」ではなく「得な候補」**: 配列部分を大きくすると、すき間（使われないマス）が増えます。`arrayXhash` で「半分以上は埋まっているか」に近い条件を課すことで、まばらな整数キーで配列が膨らむのを防いでいます。
- **2 つの目的の早期打ち切り**: ループ条件の `arrayXhash(twotoi, ct->na)` は、残りのキーを全部足しても条件を満たせない時点で止めるので、無駄な候補を調べません。
- **結果を 2 つ返す**: 戻り値で大きさを、`ct->na` で「配列に入る個数」を返します。呼び出し元（`rehash`）は、総数から `ct->na` を引くだけでハッシュ部分の大きさを決められます。

## まとめ

- Lua のテーブルは配列部分とハッシュ部分のハイブリッドで、その配分はリハッシュのたびに計算し直される。
- 「2 のべき乗ごとの個数」を前もって数えておくと、最適な大きさを短いループで求められる。
- メモリの比率（ハッシュ 1 個 ≒ 配列 3 マス）を判定式に組み込み、速さと省メモリを両立している。
- ポインタ引数を使うと、戻り値とは別に結果を書き戻せる。
