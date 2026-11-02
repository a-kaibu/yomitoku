---
title: "区切りの値で配列を切り分ける Array#split"
description: "文字列の split のように、配列を特定の値やブロックの条件で区切る。index と shift の組み合わせだけで書かれている。"
language: ruby
project: "Rails (Active Support)"
repo: https://github.com/rails/rails
license: "MIT"
copyright: "Copyright (c) David Heinemeier Hansson"
commit: "8254d3534fa9cd903dbaaa85b9e33c454e5bbb26"
file: activesupport/lib/active_support/core_ext/array/grouping.rb
lines: [115, 130]
function: "Array#split"
difficulty: 1
format: 2
tags: [イディオム, クロージャ]
---

## ひとことで

`Array#split` は、文字列の `"a,b,c".split(",")` と同じことを **配列** でするメソッドです。
`[1, 2, 3, 4, 5].split(3)` は `[[1, 2], [4, 5]]` に、`(1..10).to_a.split { |i| i % 3 == 0 }` は `[[1, 2], [4, 5], [7, 8], [10]]` になります。
区切りに使った値そのものは結果に含まれません。

## コード

```ruby:line-numbers=115
  def split(value = nil, &block)
    arr = dup
    result = []
    if block_given?
      while (idx = arr.index(&block))
        result << arr.shift(idx)
        arr.shift
      end
    else
      while (idx = arr.index(value))
        result << arr.shift(idx)
        arr.shift
      end
    end
    result << arr
  end
```

## 前提知識

- **`value = nil, &block`**: 区切りの値を引数で受け取るか、ブロックで条件を受け取るかの 2 通りに対応しています。`&block` は渡されたブロックを変数として受け取る書き方です。
- **`block_given?`**: ブロックが渡されたかどうかを返します。
- **`index(値)` と `index { 条件 }`**: 配列の中で、その値（または条件に合う要素）が最初に現れる位置を返します。見つからなければ `nil` です。
- **`shift(n)`**: 配列の先頭から n 個を **取り除いて** 返します。引数なしの `shift` は先頭 1 個を取り除きます。
- **`while (idx = ...)`**: 代入した値が `nil` でない間だけ繰り返します。Ruby では `nil` と `false` だけが偽です。
- **最後の式が戻り値**: Ruby のメソッドは最後に評価した式の値を返します。`result << arr` は、`result` 自身を返します。

## 何をしているか

### 1. 作業用のコピーを作る

```ruby:line-numbers=116
    arr = dup
    result = []
```
`arr = dup` で元の配列をコピーします。この後 `shift` でどんどん削っていくので、元の配列を守るためです。

### 2. 区切りを探しては切り出す

```ruby:line-numbers=118
    if block_given?
      while (idx = arr.index(&block))
        result << arr.shift(idx)
        arr.shift
      end
    else
      while (idx = arr.index(value))
        result << arr.shift(idx)
        arr.shift
      end
    end
```
`[1, 2, 3, 4, 5].split(3)` で追ってみます。

1. `arr.index(3)` は 2（0 から数えて 3 番目）なので、`arr.shift(2)` で `[1, 2]` を取り出して `result` に入れます。`arr` は `[3, 4, 5]` になります。
2. `arr.shift` で区切りの `3` を捨てます。`arr` は `[4, 5]` です。
3. もう一度 `index(3)` を探すと `nil` なので、ループが終わります。

ブロックの場合も、`index(&block)` で「条件に合う最初の位置」を探すだけで、流れはまったく同じです。

### 3. 残りを最後のグループにする

```ruby:line-numbers=129
    result << arr
```
残った `[4, 5]` を追加して `[[1, 2], [4, 5]]` を返します。区切りが最後の要素だった場合は、残りが `[]` なので末尾に空の配列が入ります（文字列の split とは少し違う点です）。

## ここがすごい

### 「探す」と「切る」を標準メソッドに任せている

要素を 1 つずつ見て「区切りかどうか」を判定し、一時配列に詰めていく書き方もできますが、そうするとフラグや一時変数が増えます。
このコードは **`index` で位置を探し、`shift(idx)` でまとめて切り出す** という 2 つの操作だけで書かれていて、ループの中身が 3 行しかありません。

### 区切りの指定を 2 通り受け付ける

値でもブロックでも区切れるので、「特定の値で区切る」も「条件に合うもので区切る」も同じメソッドで書けます。Ruby の標準ライブラリでも、`index` や `count` などが同じように「値かブロックか」を受け付けます。その慣習に合わせた API になっています。

### コピーしてから壊す

`shift` は配列を変更する破壊的なメソッドです。最初に `dup` しておくことで、内部では破壊的な操作で効率よく処理しつつ、外から見れば元の配列を変えない、安全なメソッドになっています。

## まとめ

- 「位置を探す」と「まとめて切り出す」を組み合わせると、区切り処理が短く書けます。
- `while (x = ...)` は「見つかる間くり返す」ときの定番の形です。
- 値とブロックの両方を受け付けるのは、Ruby の API でよく見る設計です。
- 破壊的な操作を使うときは、先にコピーして元のデータを守ります。
