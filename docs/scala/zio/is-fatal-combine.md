---
title: "致命的な例外かどうかを判定する部品を、| で組み合わせる"
description: "ZIO の IsFatal。Throwable を受け取り真偽を返す判定を、| でつないで組み合わせる。判定は木の構造で持ち、Single、Both、Empty の 3 種類で表す。"
language: scala
project: "ZIO"
repo: https://github.com/zio/zio
license: "Apache-2.0"
copyright: "Copyright 2021-2024 John A. De Goes and the ZIO Contributors"
commit: "54cc16d47b97c28e47b9d8b22f9991ab9ec83396"
file: "core/shared/src/main/scala/zio/internal/IsFatal.scala"
lines: [24, 40]
format: 2
function: "IsFatal.apply / IsFatal.|"
difficulty: 3
tags: [型システム, データ構造, 設計パターン]
---

## ひとことで

ZIO の内部では、「この例外は致命的か」を判定する仕組みを使います。`IsFatal` は、`Throwable` を受け取って真偽を返す関数の一種です。判定の部品を `|` でつなぐと、複数の型のどれかに当てはまるかを、一つの判定として扱えます。

## コード

```scala:line-numbers=24
  def apply(t: Throwable): Boolean =
    if (t.isInstanceOf[VirtualMachineError]) true
    else
      self match {
        case _: Empty.type     => false
        case Both(left, right) => left(t) || right(t)
        case Single(tag)       => tag.isAssignableFrom(t.getClass)
      }

  @deprecated("IsFatal is deprecated, kept only for binary compatability.", "2.1.21")
  def |(that: IsFatal): IsFatal =
    if (self eq Empty) that
    else
      that match {
        case _: Empty.type => self
        case _             => Both(self, that)
      }
```

## 前提知識

- `Throwable` は、例外やエラーの親となる型です。
- `Throwable => Boolean` は、例外を受け取って真偽を返す関数の型です。`IsFatal` はこの関数の仲間として作られています。
- `isAssignableFrom` は、あるクラスが別のクラスの型として使えるかを調べるメソッドです。例外の型が一致するかを確かめるのに使います。
- `sealed trait` は、同じファイルの中でしか継承できないトレイトです。取りうる種類が、ここで全部わかります。
- `|` は、判定どうしを組み合わせる演算子です。両方の判定のどちらかに当てはまれば真になります。

## 何をしているか

### 1. 判定の種類ごとに、真偽を決める

`apply` は、判定の種類によって処理を分けます。`Empty` は何も当てはまりません。`Single(tag)` は、例外の型が `tag` か、その下位の型かを調べます。`Both(left, right)` は、左か右のどちらかに当てはまれば真です。

```scala:line-numbers=24
  def apply(t: Throwable): Boolean =
    if (t.isInstanceOf[VirtualMachineError]) true
    else
      self match {
        case _: Empty.type     => false
        case Both(left, right) => left(t) || right(t)
        case Single(tag)       => tag.isAssignableFrom(t.getClass)
```

### 2. `|` で、二つの判定を一つにまとめる

`|` は、もう一方の判定 `that` を組み合わせた新しい判定を作ります。`Empty` は何も加えないので、無視されます。それ以外は `Both` でまとめます。

```scala:line-numbers=34
  def |(that: IsFatal): IsFatal =
    if (self eq Empty) that
    else
      that match {
        case _: Empty.type => self
        case _             => Both(self, that)
```

## ここがすごい

- 判定を値として持ち、`|` で足していくので、「どの例外が致命的か」の一覧を、部品の組み合わせで作れます。
- 判定を木構造（`Single` と `Both`）で持つので、組み合わせの形がそのまま判定の形になります。
- `sealed` にしているので、取りうる種類が閉じています。`match` で書き忘れがあれば、コンパイラが指摘します。
- 空の判定 `Empty` を用意しているので、判定がない場合の初期値を、特別扱いせずに書けます。

## まとめ

- `IsFatal` は、例外が致命的かを判定する関数の仲間です。
- `|` で判定を組み合わせると、どれかに当てはまるかを一つの判定で表せます。
- 判定は `Single`、`Both`、`Empty` の木で表され、`apply` がそれをたどって真偽を決めます。
