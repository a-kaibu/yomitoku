---
title: "タイムゾーンのずれを、日付の繰り上がりつきで足す"
description: "Time の apply_offset は、時差を秒・分・時・日へ順に振り分け、月や年をまたぐときも日付を正しく繰り上げたり繰り下げたりする。"
language: ruby
project: "Ruby time (標準ライブラリ)"
repo: https://github.com/ruby/time
license: "BSD-2-Clause OR Ruby"
copyright: "copyrighted free software by Yukihiro Matsumoto <matz@netlab.jp>."
commit: "63a8b164372746782d828bf7ba5587c2a6caf7cb"
file: lib/time.rb
lines: [157, 198]
function: "Time.apply_offset"
difficulty: 3
format: 2
tags: ["日時", "アルゴリズム", "数値計算"]
---
## ひとことで

`Time.apply_offset` は、ある日時に **時差（オフセット、秒単位）を足したり引いたりして、年・月・日・時・分・秒を正しく計算し直す** 内部メソッドです。
秒、分、時、日の順に、時差を繰り上げたり繰り下げたりします。
月や年をまたぐ場合も、`month_days` を使って日付を正しく直します。

## コード

```ruby:line-numbers=157
    def apply_offset(year, mon, day, hour, min, sec, off)
      if off < 0
        off = -off
        off, o = off.divmod(60)
        if o != 0 then sec += o; o, sec = sec.divmod(60); off += o end
        off, o = off.divmod(60)
        if o != 0 then min += o; o, min = min.divmod(60); off += o end
        off, o = off.divmod(24)
        if o != 0 then hour += o; o, hour = hour.divmod(24); off += o end
        if off != 0
          day += off
          days = month_days(year, mon)
          if days and days < day
            mon += 1
            if 12 < mon
              mon = 1
              year += 1
            end
            day = 1
          end
        end
      elsif 0 < off
        off, o = off.divmod(60)
        if o != 0 then sec -= o; o, sec = sec.divmod(60); off -= o end
        off, o = off.divmod(60)
        if o != 0 then min -= o; o, min = min.divmod(60); off -= o end
        off, o = off.divmod(24)
        if o != 0 then hour -= o; o, hour = hour.divmod(24); off -= o end
        if off != 0 then
          day -= off
          if day < 1
            mon -= 1
            if mon < 1
              year -= 1
              mon = 12
            end
            day = month_days(year, mon)
          end
        end
      end
      return year, mon, day, hour, min, sec
    end
```

## 前提知識

- **オフセット（時差）**: 協定世界時（UTC）との差を、秒数で表したものです。日本は `+09:00`、つまり 32400 秒です。
- **`divmod`**: 商と余りを、2 つの値として返します。`off.divmod(60)` は、秒数を分と秒に分けます。
- **繰り上がり・繰り下がり**: 秒が 60 を超えたら分へ、分が 60 を超えたら時へ、というように、大きい単位へ送ることです。
- **`month_days`**: その年・その月の日数を返すメソッドです。
- **`off < 0`**: 負のオフセットは、UTC より西の地域です。

## 何をしているか

### 1. 負のオフセットは、足す方向に計算する

```ruby:line-numbers=158
      if off < 0
        off = -off
        off, o = off.divmod(60)
        if o != 0 then sec += o; o, sec = sec.divmod(60); off += o end
        off, o = off.divmod(60)
        if o != 0 then min += o; o, min = min.divmod(60); off += o end
        off, o = off.divmod(24)
        if o != 0 then hour += o; o, hour = hour.divmod(24); off += o end
        if off != 0
          day += off
          days = month_days(year, mon)
          if days and days < day
            mon += 1
            if 12 < mon
              mon = 1
              year += 1
            end
            day = 1
          end
        end
```

オフセットが負のときは、絶対値を取り、秒・分・時・日へと順に足していきます。
まず `divmod(60)` で分と秒に分け、秒の余りを分に送り、分の余りを時に送ります。最後に日の数を足します。
日が月末を超えたら、翌月の 1 日に切り替えます。

例えば 3 時間分の差なら、時に 3 を足します。

### 2. 正のオフセットは、引く方向に計算する

```ruby:line-numbers=178
      elsif 0 < off
        off, o = off.divmod(60)
        if o != 0 then sec -= o; o, sec = sec.divmod(60); off -= o end
        off, o = off.divmod(60)
        if o != 0 then min -= o; o, min = min.divmod(60); off -= o end
        off, o = off.divmod(24)
        if o != 0 then hour -= o; o, hour = hour.divmod(24); off -= o end
        if off != 0 then
          day -= off
          if day < 1
            mon -= 1
            if mon < 1
              year -= 1
              mon = 12
            end
            day = month_days(year, mon)
          end
        end
      end
```

オフセットが正のときは、同じ手順で秒・分・時から引いていきます。日が 1 より小さくなったら、前の月へ戻します。前の月の日数は `month_days` で求めます。

### 3. 結果を、6 つの値で返す

```ruby:line-numbers=197
      return year, mon, day, hour, min, sec
```

年・月・日・時・分・秒の 6 つを、配列のように返します。呼び出し側は、この値で新しい `Time` を作れます。

## ここがすごい

### 単位の境界を、1 段ずつ送る

秒から分、分から時、時から日へ、と順番に送るので、どの段階でも数が正しく保たれます。
一度に大きな単位で割ると、途中の繰り上がりを見落としやすくなります。

### 月末をまたぐ計算を、表に任せる

日付を引いたときに、前の月の何日になるかは、月ごとに違います。
`month_days` を使うことで、うるう年や 2 月の特殊な扱いを、ここで書く必要がなくなります。

### 正負で、対称な処理を書き分ける

時差が東か西かで、足し算と引き算が逆になります。
正負を分けて、それぞれの方向に同じ構造の計算を書くことで、符号の間違いを防いでいます。

## まとめ

- 時刻の計算は、秒から順に大きな単位へ送ると、境界を正しく扱えます。
- 日付の繰り上がりや繰り下がりは、月ごとの日数を使うと、うるう年も含めて正しく計算できます。
- 向きが逆になる計算は、符号で分けて対称に書くと、読み手が正しさを確かめやすくなります。
