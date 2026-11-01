---
title: "「im」のような文字列を、正規表現のオプションの組み合わせに変える"
description: "Newtonsoft.Json の GetRegexOptions。「i」「m」「s」「x」の文字で書かれた正規表現のオプションを、対応する RegexOptions の値に変え、ビットの論理和で 1 つにまとめる。"
language: csharp
project: "Newtonsoft.Json"
repo: https://github.com/JamesNK/Newtonsoft.Json
license: MIT
copyright: "Copyright (c) 2007 James Newton-King"
commit: "52fa3aef1f2cadcd3a3f874251eddc98d3efbbaa"
file: Src/Newtonsoft.Json/Utilities/MiscellaneousUtils.cs
lines: [152, 176]
function: "MiscellaneousUtils.GetRegexOptions(string)"
difficulty: 2
format: 2
tags: [正規表現, 文字列処理, 可読性]
---

## ひとことで

`GetRegexOptions("im")` は、正規表現のオプションを表す文字列を、**オプションの組み合わせ** に変える関数です。
たとえば `"im"` は、大文字と小文字を区別しない（`i`）と、複数行として扱う（`m`）の 2 つを合わせた値になります。

文字 1 つが、オプション 1 つに対応しています。知らない文字は、無視されます。

## コード

```csharp:line-numbers=152
        internal static RegexOptions GetRegexOptions(string optionsText)
        {
            RegexOptions options = RegexOptions.None;

            for (int i = 0; i < optionsText.Length; i++)
            {
                switch (optionsText[i])
                {
                    case 'i':
                        options |= RegexOptions.IgnoreCase;
                        break;
                    case 'm':
                        options |= RegexOptions.Multiline;
                        break;
                    case 's':
                        options |= RegexOptions.Singleline;
                        break;
                    case 'x':
                        options |= RegexOptions.ExplicitCapture;
                        break;
                }
            }

            return options;
        }
```

## 前提知識

- **正規表現のオプション（`RegexOptions`）**: 正規表現の動きを変える設定の集まりです。`IgnoreCase`（大小を区別しない）、`Multiline`（行ごとに ^ と $ が働く）、`Singleline`（. が改行にも一致する）、`ExplicitCapture`（名前のないグループを捕まえない）などがあります。
- **フラグの組み合わせ**: 複数のオプションを、ビットの論理和（`|`）で 1 つの値にまとめる方法です。
- **`|=`**: `options = options | 値` の省略形です。ビットを追加します。
- **`switch` 文**: 1 文字ずつ、対応するオプションを選ぶ書き方です。
- **`RegexOptions.None`**: どのオプションも選ばれていない、初期状態です。

## 何をしているか

### 1. 初期値を用意する

```csharp:line-numbers=154
            RegexOptions options = RegexOptions.None;
```

オプションを、何も選ばれていない状態から始めます。

### 2. 文字ごとに対応するオプションを足す

```csharp:line-numbers=156
            for (int i = 0; i < optionsText.Length; i++)
            {
                switch (optionsText[i])
                {
                    case 'i':
                        options |= RegexOptions.IgnoreCase;
                        break;
                    case 'm':
                        options |= RegexOptions.Multiline;
                        break;
                    case 's':
                        options |= RegexOptions.Singleline;
                        break;
                    case 'x':
                        options |= RegexOptions.ExplicitCapture;
                        break;
                }
```

文字列を先頭から 1 文字ずつ見ます。`i`、`m`、`s`、`x` のどれかなら、対応するオプションをビットとして追加します。それ以外の文字は、何もせずに次へ進みます。

### 3. まとめた値を返す

```csharp:line-numbers=175
            return options;
```

すべての文字を見終わったら、組み合わせた値を返します。

### 具体例で確かめる

`"im"` を変換すると、次のようになります。

```
'i' → IgnoreCase を追加
'm' → Multiline を追加
結果 → IgnoreCase | Multiline
```

`"q"` のように知らない文字は、無視されて `None` のままです。

## ここがすごい

- **文字と設定を 1 対 1 で対応**: 設定文字列の書き方を、正規表現の仕組みと分けて考えられます。
- **順番を問わない**: `"im"` と `"mi"` は、同じ結果になります。ビットの論理和には順番がないからです。
- **知らない文字に強い**: 対応しない文字は捨てるので、将来の拡張や書き間違いで例外になりません。
- **短い処理**: 文字を 1 回ずつ見るだけで、必要なオプションが決まります。

## まとめ

- `GetRegexOptions` は、`i`、`m`、`s`、`x` の文字を、対応する正規表現のオプションに変える。
- 文字ごとのオプションを、ビットの論理和で 1 つにまとめる。
- 対応しない文字は無視し、順番は結果に影響しない。
