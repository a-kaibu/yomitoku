---
title: 終わりの見えないデータから公平に k 個選ぶ、読み飛ばし付きリザーバサンプリング
description: more_itertools.sample の内部関数。長さのわからない流れから、どの要素も同じ確率で選ばれるように k 個を取り出す。次に入れ替える位置まで一気に読み飛ばす Algorithm L を使っている。
language: python
project: more-itertools
repo: https://github.com/more-itertools/more-itertools
license: MIT
copyright: Copyright (c) 2012 Erik Rose
commit: "08dca284ba5446a026afdc34067b658f9da989eb"
file: more_itertools/more.py
lines: [3883, 3900]
function: _sample_unweighted
difficulty: 3
tags: [乱数, アルゴリズム, イテレータ, 最適化]
---
## ひとことで

`_sample_unweighted(iterator, k, strict)` は、**長さのわからないデータの流れから、どの要素も同じ確率で選ばれるように k 個を選ぶ** 関数です（リザーバサンプリング）。
巨大なログファイルからランダムに 100 行選ぶ、といった処理を、ファイルを 1 回読むだけで、しかも 100 行分のメモリだけで行えます。
3884〜3885 行目のコメントにある通り、Kim-Hung Li の 1994 年の論文の **Algorithm L** を実装しています。

## コード

```python:line-numbers=3883
def _sample_unweighted(iterator, k, strict):
    # Algorithm L in the 1994 paper by Kim-Hung Li:
    # "Reservoir-Sampling Algorithms of Time Complexity O(n(1+log(N/n)))".

    reservoir = list(islice(iterator, k))
    if strict and len(reservoir) < k:
        raise ValueError('Sample larger than population')
    W = 1.0

    with suppress(StopIteration):
        while True:
            W *= random() ** (1 / k)
            skip = floor(log(random()) / log1p(-W))
            element = next(islice(iterator, skip, None))
            reservoir[randrange(k)] = element

    shuffle(reservoir)
    return reservoir
```

`random`、`randrange`、`shuffle` は `random` モジュールの関数、`floor`、`log`、`log1p` は `math` モジュールの関数です。

## 前提知識

- **リザーバ（貯水池）**: 選んだ k 個を入れておくリストです。新しい要素が来るたびに、確率的に中身を入れ替えます。
- **`random()`**: 0 以上 1 未満の小数をランダムに返します。
- **`randrange(k)`**: 0 以上 k 未満の整数をランダムに返します。
- **`log1p(x)`**: `log(1 + x)` を、x が 0 に近くても精度よく計算する関数です。
- **`next(islice(iterator, skip, None))`**: イテレータを `skip` 個読み飛ばし、その次の 1 個を取り出します。
- **`with suppress(StopIteration):`**: データが尽きて `StopIteration` が出たら、エラーにせずブロックを抜けます。

## 何をしているか

### 1. 最初の k 個をそのまま入れる（3887〜3890 行目）

k 個に満たなければ、`strict` のときはエラーにします。`W` は「今のリザーバに入る確率に関係する値」で、1 から始めます。

### 2. 次に入れ替える要素まで読み飛ばす（3893〜3897 行目）

基本の考え方（Algorithm R）は、「i 番目の要素は確率 k/i でリザーバに入り、入るならランダムな位置を置き換える」です。こうすると、最後まで読んだときにどの要素も確率 k/N で残っています。
ただし、i が大きくなると入れ替えはめったに起きないので、1 つずつ乱数を引くのは無駄です。Algorithm L は、

- `W *= random() ** (1 / k)` で、確率の値を更新し
- `skip = floor(log(random()) / log1p(-W))` で、**次に入れ替えが起きるまでに何個飛ばすか** を、幾何分布という確率の分布から一発で計算します

そして `islice` でその数だけ一気に読み飛ばし、次の要素でリザーバのランダムな位置を置き換えます。

### 3. 並びをシャッフルして返す（3899〜3900 行目）

リザーバの最初の部分は入力の順番のままなので、最後にシャッフルして順番の偏りもなくします。

## ここがすごい

### 乱数を引く回数が劇的に少ない

素朴な方法（Algorithm R）では、N 個のデータに対して N 回乱数を引きます。Algorithm L では、入れ替えが起きる回数ぶん（およそ k × log(N/k) 回）しか乱数を引きません。100 億件から 100 件選ぶなら、100 億回が数千回になります。

### 読み飛ばしも C の速さで

計算した `skip` 個を飛ばす処理は `islice` が C の中で行います。Python で 1 つずつ数える必要がありません。

### データが尽きたら自然に終わる

読み飛ばしている途中でデータが尽きると、`next()` が `StopIteration` を出し、`suppress` によってループを抜けます。「あと何個残っているか」を知る必要がないので、長さのわからない流れにそのまま使えます。

### メモリは k 個分だけ

どれだけ大きなデータでも、手元に置くのはリザーバの k 個だけです。

## まとめ

- リザーバサンプリングは、長さのわからないデータから 1 回の読み込みで公平に k 個を選ぶ方法。
- 「次に何かが起きるまでの間隔」を確率分布から直接求めれば、1 つずつ判定する手間を省ける。
- 論文のアルゴリズムでも、Python の部品を使えば十数行で実装できる。
