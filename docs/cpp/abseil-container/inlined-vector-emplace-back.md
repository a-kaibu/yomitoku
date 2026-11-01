---
title: 速い道と遅い道を分けて書く InlinedVector の末尾追加
description: 空きがあるときだけの短い関数と、拡張が必要なときの長い関数に分けた emplace_back。新要素を先に作る順序と、例外時の後始末にも注目。
language: cpp
project: Abseil（コンテナ・同期・時間）
repo: https://github.com/abseil/abseil-cpp
license: Apache-2.0
commit: "4ce33a3b8a55d727ccb50d4134f869d1689039f2"
format: 2
copyright: Copyright 2019 The Abseil Authors.
file: absl/container/internal/inlined_vector.h
lines: [815, 864]
function: Storage::EmplaceBack
difficulty: 2
tags: [メモリ管理, 最適化, エラー処理, ジェネリクス]
---

## ひとことで

`absl::InlinedVector` の末尾に要素を追加する処理です。
**空きがあるとき（ほとんどの場合）は `EmplaceBack` だけで終わり**、容量が足りないときだけ、別関数 `EmplaceBackSlow` で新しい領域を確保して引っ越します。
遅い道では「新しい要素を先に作り、古い要素はあとから移す」という順序と、途中で例外が起きたときの後始末がていねいに書かれています。

## コード

::: code-group

```cpp:line-numbers=815 [日本語訳]
template <typename T, size_t N, typename A>
template <typename... Args>
auto Storage<T, N, A>::EmplaceBack(Args&&... args) -> Reference<A> {
  StorageView<A> storage_view = MakeStorageView();
  const SizeType<A> n = storage_view.size;
  if (ABSL_PREDICT_TRUE(n != storage_view.capacity)) {
    // 速い道。新しい要素が収まる。
    Pointer<A> last_ptr = storage_view.data + n;
    AllocatorTraits<A>::construct(GetAllocator(), last_ptr,
                                  std::forward<Args>(args)...);
    AddSize(1);
    return *last_ptr;
  }
  // TODO(b/173712035): 性能が落ちないよう musttail 属性を付ける。
  return EmplaceBackSlow(std::forward<Args>(args)...);
}

template <typename T, size_t N, typename A>
template <typename... Args>
auto Storage<T, N, A>::EmplaceBackSlow(Args&&... args) -> Reference<A> {
  StorageView<A> storage_view = MakeStorageView();
  AllocationTransaction<A> allocation_tx(GetAllocator());
  IteratorValueAdapter<A, MoveIterator<A>> move_values(
      MoveIterator<A>(storage_view.data));
  SizeType<A> requested_capacity = NextCapacity(storage_view.capacity);
  Pointer<A> construct_data = allocation_tx.Allocate(requested_capacity);
  Pointer<A> last_ptr = construct_data + storage_view.size;

  // 新しい要素を作る。
  AllocatorTraits<A>::construct(GetAllocator(), last_ptr,
                                std::forward<Args>(args)...);
  // 古い領域の要素を新しい領域へムーブする。
  ABSL_INTERNAL_TRY {
    ConstructElements<A>(GetAllocator(), allocation_tx.GetData(), move_values,
                         storage_view.size);
  }
  ABSL_INTERNAL_CATCH_ANY {
    AllocatorTraits<A>::destroy(GetAllocator(), last_ptr);
    ABSL_INTERNAL_RETHROW;
  }
  // 古い領域の要素を破棄する。
  DestroyAdapter<A>::DestroyElements(GetAllocator(), storage_view.data,
                                     storage_view.size);

  DeallocateIfAllocated();
  SetAllocation(std::move(allocation_tx).Release());
  SetIsAllocated();
  AddSize(1);
  return *last_ptr;
}
```

```cpp:line-numbers=815 [原文]
template <typename T, size_t N, typename A>
template <typename... Args>
auto Storage<T, N, A>::EmplaceBack(Args&&... args) -> Reference<A> {
  StorageView<A> storage_view = MakeStorageView();
  const SizeType<A> n = storage_view.size;
  if (ABSL_PREDICT_TRUE(n != storage_view.capacity)) {
    // Fast path; new element fits.
    Pointer<A> last_ptr = storage_view.data + n;
    AllocatorTraits<A>::construct(GetAllocator(), last_ptr,
                                  std::forward<Args>(args)...);
    AddSize(1);
    return *last_ptr;
  }
  // TODO(b/173712035): Annotate with musttail attribute to prevent regression.
  return EmplaceBackSlow(std::forward<Args>(args)...);
}

template <typename T, size_t N, typename A>
template <typename... Args>
auto Storage<T, N, A>::EmplaceBackSlow(Args&&... args) -> Reference<A> {
  StorageView<A> storage_view = MakeStorageView();
  AllocationTransaction<A> allocation_tx(GetAllocator());
  IteratorValueAdapter<A, MoveIterator<A>> move_values(
      MoveIterator<A>(storage_view.data));
  SizeType<A> requested_capacity = NextCapacity(storage_view.capacity);
  Pointer<A> construct_data = allocation_tx.Allocate(requested_capacity);
  Pointer<A> last_ptr = construct_data + storage_view.size;

  // Construct new element.
  AllocatorTraits<A>::construct(GetAllocator(), last_ptr,
                                std::forward<Args>(args)...);
  // Move elements from old backing store to new backing store.
  ABSL_INTERNAL_TRY {
    ConstructElements<A>(GetAllocator(), allocation_tx.GetData(), move_values,
                         storage_view.size);
  }
  ABSL_INTERNAL_CATCH_ANY {
    AllocatorTraits<A>::destroy(GetAllocator(), last_ptr);
    ABSL_INTERNAL_RETHROW;
  }
  // Destroy elements in old backing store.
  DestroyAdapter<A>::DestroyElements(GetAllocator(), storage_view.data,
                                     storage_view.size);

  DeallocateIfAllocated();
  SetAllocation(std::move(allocation_tx).Release());
  SetIsAllocated();
  AddSize(1);
  return *last_ptr;
}
```

:::

## 前提知識

- **可変長テンプレート `template <typename... Args>` と `Args&&... args`**: 任意個・任意型の引数を受け取る書き方です。`emplace_back(1, "a")` のように、要素のコンストラクタに渡す引数をそのまま受け取ります。
- **`std::forward<Args>(args)...`**: 受け取った引数を、元の性質（一時オブジェクトかどうか）を保ったまま次の関数に渡す定型句です（完全転送）。
- **`auto f(...) -> Reference<A>`**: 戻り値の型を後ろに書く書き方です。`Reference<A>` は要素への参照型です。
- **`AllocatorTraits<A>::construct(alloc, ptr, args...)`**: 確保済みのメモリ `ptr` の上で、要素のコンストラクタを呼びます。メモリ確保と構築を分けて行うための標準の仕組みです。
- **ムーブ**: コピーの代わりに中身を「移す」操作です。`MoveIterator` は読み出すとムーブになるイテレータです。
- **`ABSL_INTERNAL_TRY` / `ABSL_INTERNAL_CATCH_ANY` / `ABSL_INTERNAL_RETHROW`**: 例外を使えるビルドでは `try` / `catch (...)` / `throw;` になり、例外なしのビルドでは消えるマクロです。
- **RAII**: オブジェクトの寿命に合わせて後始末する C++ の習慣です。`AllocationTransaction` は、`Release()` されないまま破棄されると確保したメモリを返す「取引」オブジェクトです。

## 何をしているか

### 速い道

```cpp:line-numbers=815
template <typename T, size_t N, typename A>
template <typename... Args>
auto Storage<T, N, A>::EmplaceBack(Args&&... args) -> Reference<A> {
  StorageView<A> storage_view = MakeStorageView();
  const SizeType<A> n = storage_view.size;
  if (ABSL_PREDICT_TRUE(n != storage_view.capacity)) {
    // Fast path; new element fits.
    Pointer<A> last_ptr = storage_view.data + n;
    AllocatorTraits<A>::construct(GetAllocator(), last_ptr,
                                  std::forward<Args>(args)...);
    AddSize(1);
    return *last_ptr;
  }
  // TODO(b/173712035): Annotate with musttail attribute to prevent regression.
  return EmplaceBackSlow(std::forward<Args>(args)...);
}
```

`MakeStorageView()` で、いまのデータの先頭・サイズ・容量を取り出します。
サイズ `n` が容量と違えば空きがあるので、`data + n` の位置に新しい要素を作り、`AddSize(1)` して終わりです。
空きがなければ `EmplaceBackSlow` に任せます。

### 遅い道

容量 4 に 4 個入っている状態で 5 個目を追加する例で追います。

```cpp:line-numbers=836
  AllocationTransaction<A> allocation_tx(GetAllocator());
  IteratorValueAdapter<A, MoveIterator<A>> move_values(
      MoveIterator<A>(storage_view.data));
  SizeType<A> requested_capacity = NextCapacity(storage_view.capacity);
  Pointer<A> construct_data = allocation_tx.Allocate(requested_capacity);
```

1. **新しい領域を確保**: `NextCapacity(4)` で新しい容量（2 倍の 8）を決め、`allocation_tx` に確保させます。まだ「仮」の状態です。

```cpp:line-numbers=841
  Pointer<A> last_ptr = construct_data + storage_view.size;

  // Construct new element.
  AllocatorTraits<A>::construct(GetAllocator(), last_ptr,
                                std::forward<Args>(args)...);
```

2. **新しい要素を先に作る**: 新しい領域の 4 番目（`construct_data + 4`）に 5 個目を作ります。

```cpp:line-numbers=846
  // Move elements from old backing store to new backing store.
  ABSL_INTERNAL_TRY {
    ConstructElements<A>(GetAllocator(), allocation_tx.GetData(), move_values,
                         storage_view.size);
  }
  ABSL_INTERNAL_CATCH_ANY {
    AllocatorTraits<A>::destroy(GetAllocator(), last_ptr);
    ABSL_INTERNAL_RETHROW;
  }
```

3. **古い要素を移す**: 0〜3 番目へ古い要素をムーブで構築します。ここで例外が起きたら、作ったばかりの 5 個目を壊してから例外を投げ直します。確保した領域は `allocation_tx` の破棄で自動的に返されます。

```cpp:line-numbers=855
  // Destroy elements in old backing store.
  DestroyAdapter<A>::DestroyElements(GetAllocator(), storage_view.data,
                                     storage_view.size);

  DeallocateIfAllocated();
```

4. **古い領域を片付ける**: 古い要素を破棄し、古い領域がヒープなら解放します。

```cpp:line-numbers=860
  SetAllocation(std::move(allocation_tx).Release());
  SetIsAllocated();
  AddSize(1);
  return *last_ptr;
```

5. **確定**: `Release()` で取引を確定させて新しい領域を自分のものにし、「ヒープ使用中」の印を付け、サイズを 1 増やします。

## ここがすごい

- **速い道を小さく保つ**: 遅い道を `ABSL_ATTRIBUTE_NOINLINE` 付きの別関数（クラス内の宣言 `ABSL_ATTRIBUTE_NOINLINE Reference<A> EmplaceBackSlow(Args&&... args);`）にすることで、速い道はインライン展開されても数命令で済みます。呼び出し元のコードも膨らみません。
- **新しい要素を先に作る理由**: 引数 `args` が、いま入っている要素への参照かもしれないからです（`v.emplace_back(v[0])` のような場合）。古い要素を先に移してしまうと、引数が指す先が抜け殻になります。新しい要素を最初に作れば、この問題を避けられます。
- **途中で失敗しても元のまま**: 例外が出た場合、新しい要素を壊し、新領域を返し、古い領域には手を付けません。呼び出し側から見ると「何も起きなかった」状態に戻ります（強い例外保証と呼ばれます）。
- **後始末をオブジェクトに任せる**: メモリ解放のし忘れを、`AllocationTransaction` の RAII で防いでいます。

## まとめ

- よく通る短い処理と、まれな長い処理は関数を分けると速くなる。
- 拡張時は「新要素を先に作る」と、引数が既存要素を指していても安全。
- 失敗したら元に戻す設計（強い例外保証）は、作る順と片付ける順の工夫で実現できる。
- メモリの後始末は RAII のオブジェクトに任せると漏れにくい。
