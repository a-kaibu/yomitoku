---
title: "初期値から次々に値を作る、終わりのない列を作る"
description: "MoreLINQ の Generate。初期値に変換関数を繰り返し当てて、無限に続く列を作る。使う側で Take などを組み合わせ、必要な個数だけ取り出す。"
language: csharp
project: "MoreLINQ"
repo: https://github.com/morelinq/MoreLINQ
license: Apache-2.0
copyright: "Copyright (c) 2012 Atif Aziz. All rights reserved."
commit: "d217ab1e8eac68247650c27e977b767dd66bcab0"
file: MoreLinq/Generate.cs
lines: [44, 59]
function: "MoreEnumerable.Generate<TResult>(TResult, Func<TResult, TResult>)"
difficulty: 1
format: 2
tags: [イテレータ, 遅延評価, アルゴリズム]
---

## ひとことで

`Generate(initial, generator)` は、初期値から始めて、変換関数を繰り返し当てた値を **次々に返す** 関数です。
たとえば初期値 `1` に「2 倍にする」関数を使うと、`1, 2, 4, 8, 16, …` と **終わりのない列** になります。

列はいつまでも続くので、使う側で `Take(5)` のように必要な個数だけを取り出すのが基本の使い方です。

## コード

```csharp:line-numbers=44
        public static IEnumerable<TResult> Generate<TResult>(TResult initial, Func<TResult, TResult> generator)
        {
            if (generator == null) throw new ArgumentNullException(nameof(generator));

            return _(initial, generator);

            static IEnumerable<TResult> _(TResult initial, Func<TResult, TResult> generator)
            {
                var current = initial;
                while (true)
                {
                    yield return current;
                    current = generator(current);
                }
            }
        }
```

## 前提知識

- **無限列（むげんれつ）**: 終わりがない列です。`yield return` で値を作り続けるので、取り出す側が止めない限り続きます。
- **変換関数（generator）**: 今の値を受け取り、次の値を返す関数です。
- **遅延評価**: 値は、取り出されたときに初めて作られます。終わりのない列でも、全部を作る必要がないので問題になりません。
- **`Take(n)`**: 先頭から `n` 個だけを取り出す LINQ の関数です。無限列を有限にするために使います。
- **`while (true)`**: 条件が常に真の繰り返しです。ここでは、列の終わりを作らないために使います。

## 何をしているか

### 1. 初期値を用意する

```csharp:line-numbers=52
                var current = initial;
```

最初に返す値を `current` に入れます。

### 2. 値を返し、次の値を作る

```csharp:line-numbers=53
                while (true)
                {
                    yield return current;
                    current = generator(current);
                }
```

`current` を返した後、変換関数で次の値を作り、`current` を更新します。この繰り返しで、列は続いていきます。

### 具体例で確かめる

初期値 `1`、変換関数 `x => x * 2` の場合、次のように進みます。

```
最初に 1 を返す → 2 を作る
次に 2 を返す → 4 を作る
次に 4 を返す → 8 を作る
…
```

`Generate(1, x => x * 2).Take(5)` とすると、`1, 2, 4, 8, 16` が得られます。

## ここがすごい

- **状態が 1 つだけ**: 次の値を作るのに必要なのは、今の値だけです。内部に余分な情報を持ちません。
- **作るのは必要なときだけ**: `Take` で取り出した分だけ変換関数が呼ばれます。無限の列でも、計算は止まります。
- **変換の中身を外から決める**: 列の作り方は変換関数で決まるので、2 倍、加算、などを同じ形で書けます。
- **`Unfold` との違い**: 終わりの条件（述語）を持たない分、単純です。終わりは使う側に任せます。

## まとめ

- `Generate` は、初期値に変換関数を繰り返し当てて、終わりのない列を作る。
- 値は取り出されるまで作られないので、無限でも安全に使える。
- `Take` などで必要な個数だけを取り出すのが基本の使い方である。
