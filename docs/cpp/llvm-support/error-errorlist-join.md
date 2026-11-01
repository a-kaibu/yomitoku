---
title: 2 つのエラーを 1 つに束ねる join は「平らなリスト」を崩さない
description: LLVM の Error を 2 つ合体させる ErrorList::join。成功は素通り、片方がリストならそこへ追加、と場合分けして、リストの入れ子を決して作らない。
language: cpp
project: LLVM Support
repo: https://github.com/llvm/llvm-project
license: Apache-2.0 WITH LLVM-exception
copyright: Part of the LLVM Project, under the Apache License v2.0 with LLVM Exceptions.
commit: "384a71b8a2d99b5deb82792c23202c2b82b8ed82"
file: llvm/include/llvm/Support/Error.h
lines: [409, 434]
function: llvm::ErrorList::join
difficulty: 2
tags: [エラー処理, データ構造, メモリ管理]
format: 2
---

## ひとことで

`ErrorList::join(E1, E2)` は、2 つの `Error` を 1 つにまとめます（外からは `joinErrors` として使います）。

- 片方が成功（エラーなし）なら、もう片方をそのまま返す
- 両方が失敗なら、**両方を含む `ErrorList`** を返す

たとえば複数のファイルを処理して、失敗をすべて集めて最後にまとめて報告したいときに使います。

ポイントは、何回 `join` しても **`ErrorList` の中に `ErrorList` が入る入れ子を作らない**ことです。

## コード

```cpp:line-numbers=409
  static Error join(Error E1, Error E2) {
    if (!E1)
      return E2;
    if (!E2)
      return E1;
    if (E1.isA<ErrorList>()) {
      auto &E1List = static_cast<ErrorList &>(*E1.getPtr());
      if (E2.isA<ErrorList>()) {
        auto E2Payload = E2.takePayload();
        auto &E2List = static_cast<ErrorList &>(*E2Payload);
        for (auto &Payload : E2List.Payloads)
          E1List.Payloads.push_back(std::move(Payload));
      } else {
        E1List.Payloads.push_back(E2.takePayload());
      }

      return E1;
    }
    if (E2.isA<ErrorList>()) {
      auto &E2List = static_cast<ErrorList &>(*E2.getPtr());
      E2List.Payloads.insert(E2List.Payloads.begin(), E1.takePayload());
      return E2;
    }
    return Error(std::unique_ptr<ErrorList>(
        new ErrorList(E1.takePayload(), E2.takePayload())));
  }
```

## 前提知識

- **`Error`**: LLVM のエラー型です。中身は「エラー情報（`ErrorInfoBase` の子クラス）へのポインタ」で、成功なら空です。`if (!E1)` は「E1 が成功なら」という意味です。
- **`ErrorList`**: 複数のエラー情報を `std::vector` に持つ、特別なエラー情報です。`Payloads` がその配列です。
- **`std::unique_ptr`**: 持ち主が 1 人だけのポインタです。持ち主が消えると中身も自動で解放されます。コピーはできず、`std::move` で持ち主を移すことしかできません。
- **`std::move`**: 「この値の中身を移動してよい」という印です。`unique_ptr` を別の場所に渡すときに使います。
- **`takePayload()`**: `Error` の中のエラー情報を `unique_ptr` として取り出し、`Error` 自身は空（成功）にする内部関数です。
- **`static_cast<ErrorList &>(...)`**: 親クラスの参照を子クラスの参照として扱う変換です。`isA` で確認済みなので安全です。
- **`static` メンバー関数**: オブジェクトなしで `ErrorList::join(...)` と呼べる関数です。

## 何をしているか

エラー情報を `A`、`B`、`C` と書き、`[A, B]` を `ErrorList` とします。

### 1. どちらかが成功なら、もう片方を返す

```cpp:line-numbers=410
    if (!E1)
      return E2;
    if (!E2)
      return E1;
```

`join(成功, A)` は `A`、`join(A, 成功)` は `A` です。両方成功なら成功が返ります。

### 2. E1 がリストなら、そこへ足す

```cpp:line-numbers=414
    if (E1.isA<ErrorList>()) {
      auto &E1List = static_cast<ErrorList &>(*E1.getPtr());
      if (E2.isA<ErrorList>()) {
        auto E2Payload = E2.takePayload();
        auto &E2List = static_cast<ErrorList &>(*E2Payload);
        for (auto &Payload : E2List.Payloads)
          E1List.Payloads.push_back(std::move(Payload));
      } else {
        E1List.Payloads.push_back(E2.takePayload());
      }

      return E1;
    }
```

`join([A, B], C)` なら、`[A, B]` の末尾に `C` を加えて `[A, B, C]` を返します。
`join([A, B], [C, D])` なら、E2 のリストを取り出し、中身を 1 つずつ E1 のリストへ移して `[A, B, C, D]` にします。空になった E2 側の `ErrorList` は、`E2Payload` という `unique_ptr` が消えるときに自動で解放されます。

### 3. E2 がリストなら、先頭に差し込む

```cpp:line-numbers=427
    if (E2.isA<ErrorList>()) {
      auto &E2List = static_cast<ErrorList &>(*E2.getPtr());
      E2List.Payloads.insert(E2List.Payloads.begin(), E1.takePayload());
      return E2;
    }
```

`join(A, [B, C])` は `[A, B, C]` です。**E1 のエラーが前**という順番を保つため、末尾ではなく先頭に `insert` しています。

### 4. どちらも単独なら、新しいリストを作る

```cpp:line-numbers=432
    return Error(std::unique_ptr<ErrorList>(
        new ErrorList(E1.takePayload(), E2.takePayload())));
```

`join(A, B)` は新しい `ErrorList` `[A, B]` を作ります。`ErrorList` のコンストラクタは、引数がリストでないことを `assert` で確かめています。

## ここがすごい

素直に書くなら、両方が失敗のときは毎回 `new ErrorList(E1, E2)` を作れば済みます。しかしそうすると、`join` を繰り返したときに

```
join(join(join(A, B), C), D)  →  [[[A, B], C], D]
```

のような入れ子ができてしまいます。表示するにも処理するにも、再帰的にたどる必要が出てきます。

この実装は「どちらかが既にリストなら、そこに追加する」と場合分けすることで、結果を**常に平らなリスト**に保っています。

- 入れ子が無いので、`handleErrors` などはリストの各要素を 1 段のループで処理できる
- 既存のリストを使い回すので、余計な `ErrorList` を作らない
- エラーの順番（E1 の後に E2）は、どの場合でも保たれる

さらに、すべてのエラー情報は `unique_ptr` で移動されます。コピーは 1 度も起きず、持ち主が常に 1 人なので、解放し忘れも二重解放もありません。

成功の扱いも自然です。ループの中で `R = join(R, 新しいエラー)` と書けば、最初は成功の `R` から始めて、失敗だけが溜まっていきます。

## まとめ

- 「まとめる」操作では、入れ子を作らず平らなリストに保つと後の処理が単純になる。
- 片方が既にリストなら、新しく作らずにそこへ追加する。
- 順番を保つために、場合によって末尾追加と先頭挿入を使い分ける。
- `unique_ptr` と `std::move` で、コピーなしに持ち主を移しながら組み立てる。
