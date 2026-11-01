---
title: "状態から次の値を作り、条件を満たす限り列を生み出す"
description: "MoreLINQ の Unfold。初期の状態から値を作り、その値で次の状態を決める、という繰り返しで列を生成する。条件を満たさなくなったところで終わる。"
language: csharp
project: "MoreLINQ"
repo: https://github.com/morelinq/MoreLINQ
license: Apache-2.0
copyright: "Copyright (c) 2012 Atif Aziz. All rights reserved."
commit: "d217ab1e8eac68247650c27e977b767dd66bcab0"
file: MoreLinq/Unfold.cs
lines: [73, 83]
function: "MoreEnumerable.Unfold<TState, T, TResult>(TState, Func<TState, T>, Func<T, bool>, Func<T, TState>, Func<T, TResult>)"
difficulty: 3
format: 2
tags: [イテレータ, 遅延評価, アルゴリズム]
---

## ひとことで

`Unfold` は、**状態** から値を作り、その値をもとに次の状態を決める、という繰り返しで列を作る関数です。
たとえば、状態 `1` から始めて、値を 2 倍にし続ければ、`1, 2, 4, 8, 16` という列になります。条件（ここでは 16 以下）を満たさなくなったところで、列は終わります。

`Aggregate` が列を 1 つの値にまとめるのに対し、`Unfold` は値から列を **広げていく** 逆の働きをします。

## コード

```csharp:line-numbers=73
                for (var state = initialState; ;)
                {
                    var step = generator(state);

                    if (!predicate(step))
                        yield break;

                    yield return resultSelector(step);
                    state = stateSelector(step);
                }
            }
```

## 前提知識

- **状態（state）**: 次の値を作るために覚えておく情報です。数値のこともあれば、複数の値の組のこともあります。
- **生成関数（generator）**: 状態から、今の値を作る関数です。
- **述語（predicate）**: 値を受け取り、列を続けるかどうかを `true` か `false` で返す関数です。
- **状態の更新（stateSelector）**: 今の値から、次の状態を作る関数です。
- **無限ループと終了条件**: `for (var state = ...; ;)` は終わりのない繰り返しです。ここでは述語が `false` になったときに `yield break` で抜けます。

## 何をしているか

### 1. 状態から値を作る

```csharp:line-numbers=75
                    var step = generator(state);
```

現在の状態を `generator` に渡し、今回の値 `step` を作ります。

### 2. 条件を確かめる

```csharp:line-numbers=77
                    if (!predicate(step))
                        yield break;
```

`predicate` が `false` なら、列はここで終わります。`yield break` で抜けます。

### 3. 値を返す

```csharp:line-numbers=80
                    yield return resultSelector(step);
```

条件を満たしていれば、`resultSelector` で結果の形に変えてから返します。

### 4. 次の状態へ進む

```csharp:line-numbers=81
                    state = stateSelector(step);
                }
```

`stateSelector` で、今の値から次の状態を作り、次の繰り返しに備えます。

### 具体例で確かめる

状態 `1` から、値を 2 倍にしながら `16` 以下のものを作ると、次のようになります。

```
state=1  → step=1  （1 ≤ 16）→ 返す → 次の state=2
state=2  → step=2  （2 ≤ 16）→ 返す → 次の state=4
state=4  → step=4  → 返す → 次の state=8
state=8  → step=8  → 返す → 次の state=16
state=16 → step=16 → 返す → 次の state=32
state=32 → step=32 （16 を超える）→ 終わり
```

## ここがすごい

- **状態と値を分けられる**: 状態は内部の計算にだけ使い、外には `resultSelector` で整えた値だけを渡せます。
- **終わり方を決められる**: 述語で止める条件を書くので、無限に続く計算でも、必要な所で止められます。
- **遅延して返す**: 次の値は、取り出されるまで作りません。大きな数列でも必要な分だけ作ります。
- **多くの列を 1 つの形で書ける**: 等比数列、フィボナッチ数列、ページ送りなど、「前の状態から次を決める」列をすべて同じ形で書けます。

## まとめ

- `Unfold` は、状態から値を作り、次の状態を決めることを繰り返して列を作る。
- 述語が `false` になった時点で、列は終わる。
- 状態と値を分けて扱えるので、数列や分割の処理を同じ形で書ける。
