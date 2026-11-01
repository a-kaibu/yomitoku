---
title: 型で振り分けるエラーハンドラを、可変長テンプレートの再帰で順に試す
description: LLVM の handleErrors は、ラムダを何個でも受け取り、エラーの型に合う最初の 1 つを呼ぶ。try-catch の catch 節の並びを、例外なしのテンプレートで再現している。
language: cpp
project: LLVM Support
repo: https://github.com/llvm/llvm-project
license: Apache-2.0 WITH LLVM-exception
copyright: Part of the LLVM Project, under the Apache License v2.0 with LLVM Exceptions.
commit: "384a71b8a2d99b5deb82792c23202c2b82b8ed82"
file: llvm/include/llvm/Support/Error.h
lines: [969, 1007]
function: llvm::handleErrors
difficulty: 3
tags: [エラー処理, ジェネリクス, 再帰]
format: 2
---

## ひとことで

`handleErrors` は、`Error` の中身を、**型ごとに用意したハンドラ（処理関数）**に振り分けます。

```cpp
Error Rest = handleErrors(std::move(Err),
    [](const FileNotFound &E) { /* ファイルが無いときの処理 */ },
    [](const PermissionDenied &E) { /* 権限が無いときの処理 */ });
```

例外の `try { } catch (A) { } catch (B) { }` に似ていますが、LLVM は例外を使いません。その代わり、**ハンドラを上から順に試して、型が合った最初の 1 つを呼ぶ**処理を、テンプレートの再帰で組み立てています。どれにも合わなかったエラーは、戻り値として返されます。

## コード

::: code-group

```cpp:line-numbers=969 [日本語訳]
inline Error handleErrorImpl(std::unique_ptr<ErrorInfoBase> Payload) {
  return Error(std::move(Payload));
}

template <typename HandlerT, typename... HandlerTs>
Error handleErrorImpl(std::unique_ptr<ErrorInfoBase> Payload,
                      HandlerT &&Handler, HandlerTs &&... Handlers) {
  if (ErrorHandlerTraits<HandlerT>::appliesTo(*Payload))
    return ErrorHandlerTraits<HandlerT>::apply(std::forward<HandlerT>(Handler),
                                               std::move(Payload));
  return handleErrorImpl(std::move(Payload),
                         std::forward<HandlerTs>(Handlers)...);
}

/// E に含まれる ErrorInfo を、それぞれに合うハンドラへ渡す。
/// 処理されなかったエラー（またはハンドラが返した Error）は、再び連結して
/// 返す。
/// この関数はエラーを返すので、その結果も確認するか
/// 呼び出し元へ返すこと。すべてのエラーを処理するつもりなら、handleAllErrors
/// （void を返し、未処理のエラーがあれば abort() する）を代わりに使うこと。
template <typename... HandlerTs>
Error handleErrors(Error E, HandlerTs &&... Hs) {
  if (!E)
    return Error::success();

  std::unique_ptr<ErrorInfoBase> Payload = E.takePayload();

  if (Payload->isA<ErrorList>()) {
    ErrorList &List = static_cast<ErrorList &>(*Payload);
    Error R;
    for (auto &P : List.Payloads)
      R = ErrorList::join(
          std::move(R),
          handleErrorImpl(std::move(P), std::forward<HandlerTs>(Hs)...));
    return R;
  }

  return handleErrorImpl(std::move(Payload), std::forward<HandlerTs>(Hs)...);
}
```

```cpp:line-numbers=969 [原文]
inline Error handleErrorImpl(std::unique_ptr<ErrorInfoBase> Payload) {
  return Error(std::move(Payload));
}

template <typename HandlerT, typename... HandlerTs>
Error handleErrorImpl(std::unique_ptr<ErrorInfoBase> Payload,
                      HandlerT &&Handler, HandlerTs &&... Handlers) {
  if (ErrorHandlerTraits<HandlerT>::appliesTo(*Payload))
    return ErrorHandlerTraits<HandlerT>::apply(std::forward<HandlerT>(Handler),
                                               std::move(Payload));
  return handleErrorImpl(std::move(Payload),
                         std::forward<HandlerTs>(Handlers)...);
}

/// Pass the ErrorInfo(s) contained in E to their respective handlers. Any
/// unhandled errors (or Errors returned by handlers) are re-concatenated and
/// returned.
/// Because this function returns an error, its result must also be checked
/// or returned. If you intend to handle all errors use handleAllErrors
/// (which returns void, and will abort() on unhandled errors) instead.
template <typename... HandlerTs>
Error handleErrors(Error E, HandlerTs &&... Hs) {
  if (!E)
    return Error::success();

  std::unique_ptr<ErrorInfoBase> Payload = E.takePayload();

  if (Payload->isA<ErrorList>()) {
    ErrorList &List = static_cast<ErrorList &>(*Payload);
    Error R;
    for (auto &P : List.Payloads)
      R = ErrorList::join(
          std::move(R),
          handleErrorImpl(std::move(P), std::forward<HandlerTs>(Hs)...));
    return R;
  }

  return handleErrorImpl(std::move(Payload), std::forward<HandlerTs>(Hs)...);
}
```

:::

## 前提知識

- **可変長テンプレート `typename... HandlerTs`**: 任意の個数の型を受け取れます。`Hs` は「ハンドラの並び」です。`std::forward<HandlerTs>(Hs)...` と書くと、並びをそのまま展開して次の関数に渡せます。
- **関数のオーバーロードと再帰**: 同じ名前 `handleErrorImpl` で、ハンドラ 0 個の版と 1 個以上の版を用意しています。1 個以上の版は、先頭を 1 つ取り出して残りで自分を呼びます。
- **`HandlerT &&`（転送参照）と `std::forward`**: テンプレートの `&&` は、渡された値の種類（一時的な値か、変数か）を保ったまま受け取れる参照です。`std::forward` で、その種類のまま次へ渡します。
- **`std::unique_ptr<ErrorInfoBase>`**: エラー情報を 1 人だけが持つポインタです。`std::move` で持ち主を移します。
- **`ErrorHandlerTraits<HandlerT>`**: 同じファイルにあるテンプレートで、ハンドラの引数の型を読み取り、「このハンドラはこのエラーに使えるか（`appliesTo`）」と「呼び出し（`apply`）」を提供します。
- **`ErrorList`**: 複数のエラーをまとめたものです。`ErrorList::join` で結果を 1 つに合体できます。

## 何をしているか

### 1. ハンドラが尽きたら、エラーを包み直して返す

```cpp:line-numbers=969
inline Error handleErrorImpl(std::unique_ptr<ErrorInfoBase> Payload) {
  return Error(std::move(Payload));
}
```

試すハンドラが残っていなければ、そのエラーは「処理されなかった」ので、`Error` に戻して呼び出し元に返します。

### 2. 先頭のハンドラを試し、だめなら残りへ

```cpp:line-numbers=976
  if (ErrorHandlerTraits<HandlerT>::appliesTo(*Payload))
    return ErrorHandlerTraits<HandlerT>::apply(std::forward<HandlerT>(Handler),
                                               std::move(Payload));
  return handleErrorImpl(std::move(Payload),
                         std::forward<HandlerTs>(Handlers)...);
```

`FileNotFound` のエラーに対して、上の例の 2 つのハンドラを渡したとします。

```
handleErrorImpl(P, H1, H2)
  H1 は FileNotFound 用？ → はい → H1 を呼んで、その戻り値を返す
```

`PermissionDenied` なら:

```
handleErrorImpl(P, H1, H2)
  H1 は使える？ → いいえ → handleErrorImpl(P, H2)
    H2 は使える？ → はい → H2 を呼ぶ
```

どちらでもないエラーなら、さらに `handleErrorImpl(P)` に進み、1 の版でそのまま返されます。

この再帰は**コンパイル時に展開**されます。実行時には「`if` が並んでいるだけ」のコードになります。

### 3. 成功なら何もしない

```cpp:line-numbers=991
  if (!E)
    return Error::success();

  std::unique_ptr<ErrorInfoBase> Payload = E.takePayload();
```

成功なら即座に成功を返します。失敗なら、中身のエラー情報を取り出します。

### 4. 複数のエラーなら 1 つずつ振り分けて、残りを束ね直す

```cpp:line-numbers=996
  if (Payload->isA<ErrorList>()) {
    ErrorList &List = static_cast<ErrorList &>(*Payload);
    Error R;
    for (auto &P : List.Payloads)
      R = ErrorList::join(
          std::move(R),
          handleErrorImpl(std::move(P), std::forward<HandlerTs>(Hs)...));
    return R;
  }
```

`[FileNotFound, OutOfMemory]` のようなリストなら、要素ごとに `handleErrorImpl` を呼びます。処理できなかったもの（またはハンドラが返した新しいエラー）を `ErrorList::join` で集め直し、まとめて返します。

## ここがすごい

例外を使わない言語環境で「型によってエラー処理を振り分けたい」とき、素直に書くと次のようになります。

```cpp
if (E.isA<FileNotFound>()) { ... }
else if (E.isA<PermissionDenied>()) { ... }
else return E;
```

これを毎回呼び出し側で書くのは手間で、キャスト（型の変換）のし忘れも起きがちです。

`handleErrors` は、

- **ハンドラの引数の型**から「どのエラー用か」を自動で読み取る（`ErrorHandlerTraits` の役目）
- 「先頭を試して、だめなら残りで再帰」という**数行の関数 2 つ**で、任意個のハンドラを順に試す
- 処理されなかったエラーを**必ず返す**ので、`Error` の「確認しないと止まる」仕組みと合わせて、取りこぼしが起きない

という形で、`catch` の並びとほぼ同じ書き心地を実現しています。

ハンドラ 0 個の版を「終わり」として用意し、1 個以上の版から再帰させるのは、C++17 の畳み込み式が使えない場面での可変長テンプレートの定番の書き方です。ここでは「最初に合ったものだけ呼んで止まる」必要があるので、再帰の形がよく合っています。

## まとめ

- 「先頭を処理して、残りで自分を呼ぶ」再帰で、可変長テンプレートの引数を順に試せる。
- 再帰の終わりとして、引数 0 個の版をオーバーロードで用意する。
- 処理できなかったものは捨てずに返すと、エラーの取りこぼしを防げる。
- 型による振り分けは、例外がなくてもテンプレートで実現できる。
