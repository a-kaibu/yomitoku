---
title: "YAML の文字列を、規則の順に正規表現で照らして型を決める"
description: "YAML の値が true や 123 のどの型かを、登録された規則を先頭から順に正規表現で調べて決める Yams の resolveTag(from:)。最初に合った規則が勝つ。"
language: swift
project: "Yams"
repo: https://github.com/jpsim/Yams
license: MIT
copyright: "Copyright (c) 2016 JP Simard."
commit: "df801bc4f158f107035d2e14f6d0d8d31eb31ddb"
file: Sources/Yams/Resolver.swift
lines: [87, 92]
function: "resolveTag(from:)"
difficulty: 2
tags: [パース, 正規表現]
format: 2
---
## ひとことで

YAML では、`true` は真偽値、`123` は整数、`abc` は文字列として扱われます。書かれた文字だけで型を決めるため、Yams は規則の一覧を先頭から順に調べ、最初に合った規則のタグを使います。

## コード

```swift:line-numbers=87
    func resolveTag(from string: String) -> Tag.Name {
        for rule in rules where rule.regexp.matches(in: string) {
            return rule.tag
        }
        return .str
    }
```

## 前提知識

- **YAML のタグ**: 値の型を表す印です。`!!int` や `!!str` などの形で、型を明示することもできます。書かれていないときは、この resolver が型を決めます。
- **正規表現**: 文字の並びの形を、パターンで表す方法です。`^...$` は、文字列の先頭から末尾までがパターンに一致する、という意味です。
- **`regexp.matches(in:)`**: 文字列がパターンに一致するかを調べるメソッドです。
- **順序の意味**: 同じ文字列が複数の規則に合うとき、先に並んだ規則が勝ちます。

## 何をしているか

### 1. 規則を先頭から順に調べる

`where` で、文字列がその規則に一致するものだけを選びます。一致した最初の規則で、すぐ `return` します。

```swift:line-numbers=88
        for rule in rules where rule.regexp.matches(in: string) {
            return rule.tag
        }
```
### 2. どの規則にも合わなければ、文字列にする

すべての規則に合わないときは、普通の文字列（`str`）として扱います。

```swift:line-numbers=91
        return .str
```
### 3. 整数の規則の例

整数の規則は、2 進数（`0b`）、8 進数（`0o`）、10 進数、16 進数（`0x`）を、1 つの正規表現でまとめています。`_` の区切りも許しています。

```swift:line-numbers=117
    public static let int = try! Resolver.Rule(.int, """
        ^(?:[-+]?0b[0-1_]+\
        |[-+]?0o?[0-7_]+\
        |[-+]?(?:0|[1-9][0-9_]*)\
        |[-+]?0x[0-9a-fA-F_]+\
        |[-+]?[1-9][0-9_]*(?::[0-5]?[0-9])+)$
        """)
```
## ここがすごい

- **書かれた形だけで型が決まる**: 文字列の中身を解釈しなくても、正規表現の一致で型が分かります。
- **順序で重なりを解決する**: 同じ文字列が複数の型に見えても、先に並べた規則が優先されます。規則を並べ替えると、結果が変わります。
- **規則を差し替えられる**: `appending` や `replacing` で、規則の一覧を変えられます。独自の型を追加するときにも使えます。

## まとめ

- 規則の一覧を先頭から順に調べ、最初に一致したタグを使う。
- どれにも合わなければ、文字列として扱う。
- 規則の順番が結果を決めるので、並びには意味がある。
