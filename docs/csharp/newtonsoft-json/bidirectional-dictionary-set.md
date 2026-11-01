---
title: "2 つの値を、両方向から引けるように対にして登録する"
description: "Newtonsoft.Json の BidirectionalDictionary.Set。最初の値から 2 番目の値を、2 番目の値から最初の値を、どちらも引けるように 2 つの辞書を同時に管理する。すでに別の対応があれば例外で知らせる。"
language: csharp
project: "Newtonsoft.Json"
repo: https://github.com/JamesNK/Newtonsoft.Json
license: MIT
copyright: "Copyright (c) 2007 James Newton-King"
commit: "52fa3aef1f2cadcd3a3f874251eddc98d3efbbaa"
file: Src/Newtonsoft.Json/Utilities/BidirectionalDictionary.cs
lines: [65, 85]
function: "BidirectionalDictionary<TFirst, TSecond>.Set(TFirst, TSecond)"
difficulty: 2
format: 2
tags: [データ構造, ハッシュ, 防御的プログラミング]
---

## ひとことで

`BidirectionalDictionary` は、2 つの値を **対にして覚える** 辞書です。
たとえば「名前 → ID」と「ID → 名前」の両方を、同じ 1 つの仕組みで引けます。

`Set(first, second)` は、その対を登録する処理です。すでに同じ値が別の相手と対になっていれば、矛盾するので例外で知らせます。

## コード

```csharp:line-numbers=65
        public void Set(TFirst first, TSecond second)
        {
            if (_firstToSecond.TryGetValue(first, out TSecond? existingSecond))
            {
                if (!existingSecond!.Equals(second))
                {
                    throw new ArgumentException(_duplicateFirstErrorMessage.FormatWith(CultureInfo.InvariantCulture, first));
                }
            }

            if (_secondToFirst.TryGetValue(second, out TFirst? existingFirst))
            {
                if (!existingFirst!.Equals(first))
                {
                    throw new ArgumentException(_duplicateSecondErrorMessage.FormatWith(CultureInfo.InvariantCulture, second));
                }
            }

            _firstToSecond.Add(first, second);
            _secondToFirst.Add(second, first);
        }
```

## 前提知識

- **`Dictionary<TKey, TValue>`**: キーから値を引く辞書です。1 つの方向の対応を表します。
- **双方向の対応**: 最初から 2 番目へ、2 番目から最初へ、どちらの方向にも引けることです。
- **`TryGetValue`**: キーがあるかを調べ、あれば値を取り出す処理です。見つからなくても例外になりません。
- **`ArgumentException`**: 引数の組み合わせが正しくないときに投げる例外です。
- **`Equals`**: 2 つの値が同じかどうかを比べるための関数です。

## 何をしているか

### 1. 最初の値の既存の対応を確かめる

```csharp:line-numbers=67
            if (_firstToSecond.TryGetValue(first, out TSecond? existingSecond))
            {
                if (!existingSecond!.Equals(second))
                {
                    throw new ArgumentException(_duplicateFirstErrorMessage.FormatWith(CultureInfo.InvariantCulture, first));
                }
```

`first` が既に登録されていて、その相手が今回の `second` と違えば、例外を投げます。同じ相手なら問題ありません。

### 2. 2 番目の値の既存の対応を確かめる

```csharp:line-numbers=75
            if (_secondToFirst.TryGetValue(second, out TFirst? existingFirst))
            {
                if (!existingFirst!.Equals(first))
                {
                    throw new ArgumentException(_duplicateSecondErrorMessage.FormatWith(CultureInfo.InvariantCulture, second));
                }
```

同じように、`second` が既に別の `first` と対になっていれば、例外を投げます。

### 3. 両方の辞書に登録する

```csharp:line-numbers=83
            _firstToSecond.Add(first, second);
            _secondToFirst.Add(second, first);
```

両方の辞書に、対応を追加します。こうして、どちらの方向からも、同じ対応を引けるようになります。

### 具体例で確かめる

`Set(1, "a")` を実行したあと、次の動きになります。

```
Set(1, "a")   → 両方向に登録される
Set(1, "a")   → 同じ対応なので、何もせず成功
Set(1, "b")   → 1 は既に "a" と対なので、例外
Set(2, "a")   → "a" は既に 1 と対なので、例外
```

## ここがすごい

- **両方向を 1 回の登録で揃える**: 利用する側は、どちらの方向で引いても同じ結果を得られます。
- **矛盾を早く見つける**: 対応が食い違うと、後で値が二重に指される状態になってしまいます。登録の時点で例外にして、問題の場所を分かりやすくしています。
- **同じ対応の再登録を許す**: 同じ組を何度登録しても、例外にならず、結果は変わりません。
- **メッセージを整える**: 例外の文には、問題の値を入れて、どこが矛盾しているかを伝えます。

## まとめ

- `Set` は、2 つの値を対にして、両方の辞書へ同時に登録する。
- どちらかの値がすでに別の相手と対になっていれば、例外で知らせる。
- 同じ対応の再登録は許され、双方向の対応が常に一致した状態を保つ。
