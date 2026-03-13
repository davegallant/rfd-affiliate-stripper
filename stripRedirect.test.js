import { describe, it } from "node:test";
import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";

const redirects = JSON.parse(readFileSync("redirects.json", "utf8"));

function stripRedirect(URL, redirectRegex) {
  var previousURL;
  do {
    previousURL = URL;
    for (var i = 0; i < redirectRegex.length; i++) {
      var rule = redirectRegex[i];
      var result = new RegExp(rule.pattern).exec(URL);

      if (result) {
        var newURL = result.groups.baseUrl;
        if (result.groups.rest) {
          newURL += (newURL.includes("?") ? "&" : "?") + result.groups.rest;
        }
        try {
          URL = decodeURIComponent(newURL);
        } catch (e) {
          // ignore decode errors
        }
        break;
      }
    }
  } while (URL !== previousURL);

  return URL;
}

function strip(url) {
  return stripRedirect(url, redirects);
}

describe("Amazon redirect", () => {
  it("should strip Amazon /gp/redirect.html with encoded URL", () => {
    const input =
      "https://www.amazon.ca/gp/redirect.html?ie=UTF8&location=https%3A%2F%2Fwww.amazon.ca%2Fdp%2FB0TEST&ref%3Dtest";
    const result = strip(input);
    assert.equal(result, "https://www.amazon.ca/dp/B0TEST");
  });

  it("should strip Amazon .com redirect", () => {
    const input =
      "https://www.amazon.com/gp/redirect.html?ie=UTF8&location=https%3A%2F%2Fwww.amazon.com%2Fdp%2FB0ABCDEF&ref%3Dfoo";
    const result = strip(input);
    assert.equal(result, "https://www.amazon.com/dp/B0ABCDEF");
  });
});

describe("Amazon tag", () => {
  it("should strip tag as last query param", () => {
    const input =
      "https://www.amazon.ca/dp/B0DFLGW8MF?crid=123&dib=test&tag=redflagdealsc-20";
    assert.equal(strip(input), "https://www.amazon.ca/dp/B0DFLGW8MF?crid=123&dib=test");
  });

  it("should strip tag as first query param and keep rest", () => {
    const input =
      "https://www.amazon.ca/dp/B0DFLGW8MF?tag=redflagdealsc-20&crid=123&dib=test";
    assert.equal(strip(input), "https://www.amazon.ca/dp/B0DFLGW8MF?crid=123&dib=test");
  });

  it("should strip tag as only query param", () => {
    const input = "https://www.amazon.ca/dp/B0DFLGW8MF?tag=redflagdealsc-20";
    assert.equal(strip(input), "https://www.amazon.ca/dp/B0DFLGW8MF");
  });

  it("should strip tag in the middle of query params", () => {
    const input =
      "https://www.amazon.ca/dp/B0DFLGW8MF?th=1&tag=redflagdealsc-20&other=2";
    assert.equal(strip(input), "https://www.amazon.ca/dp/B0DFLGW8MF?th=1&other=2");
  });

  it("should strip tag from amazon.com", () => {
    const input = "https://www.amazon.com/dp/B0TEST?tag=sometag-20&foo=bar";
    assert.equal(strip(input), "https://www.amazon.com/dp/B0TEST?foo=bar");
  });
});

describe("Amazon ref query param", () => {
  it("should strip ref as first param and keep rest", () => {
    const input =
      "https://www.amazon.ca/dp/B0DFLGW8MF?ref=ppx_yo2ov_dt_b_fed_asin_title&th=1";
    assert.equal(strip(input), "https://www.amazon.ca/dp/B0DFLGW8MF?th=1");
  });

  it("should strip ref as only query param", () => {
    const input =
      "https://www.amazon.ca/dp/B0DFLGW8MF?ref=ppx_yo2ov_dt_b_fed_asin_title";
    assert.equal(strip(input), "https://www.amazon.ca/dp/B0DFLGW8MF");
  });

  it("should strip ref as last query param", () => {
    const input =
      "https://www.amazon.ca/dp/B0DFLGW8MF?th=1&ref=ppx_yo2ov_dt_b_fed_asin_title";
    assert.equal(strip(input), "https://www.amazon.ca/dp/B0DFLGW8MF?th=1");
  });
});

describe("Amazon ref path segment", () => {
  it("should strip /ref= from path with query params", () => {
    const input =
      "https://www.amazon.ca/BenQ-Monitor/dp/B0DBB63XGC/ref=sr_1_1?crid=123&dib=test";
    assert.equal(
      strip(input),
      "https://www.amazon.ca/BenQ-Monitor/dp/B0DBB63XGC"
    );
  });

  it("should strip /ref= from path with no query params", () => {
    const input =
      "https://www.amazon.ca/BenQ-Monitor/dp/B0DBB63XGC/ref=sr_1_1";
    assert.equal(
      strip(input),
      "https://www.amazon.ca/BenQ-Monitor/dp/B0DBB63XGC"
    );
  });
});

describe("Amazon combined tag + ref", () => {
  it("should strip both tag and ref path segment", () => {
    const input =
      "https://www.amazon.ca/BenQ-Monitor/dp/B0DBB63XGC/ref=sr_1_1?crid=123&tag=redflagdealsc-20&dib=test";
    assert.equal(
      strip(input),
      "https://www.amazon.ca/BenQ-Monitor/dp/B0DBB63XGC"
    );
  });

  it("should strip both tag and ref query param", () => {
    const input =
      "https://www.amazon.ca/dp/B0TEST?ref=sr_1_1&tag=rfd-20&other=yes";
    assert.equal(strip(input), "https://www.amazon.ca/dp/B0TEST?other=yes");
  });
});

describe("Amazon no-op", () => {
  it("should not modify a clean Amazon URL", () => {
    const input = "https://www.amazon.ca/dp/B0DFLGW8MF?th=1";
    assert.equal(strip(input), input);
  });

  it("should not modify a bare Amazon product URL", () => {
    const input = "https://www.amazon.ca/dp/B0DFLGW8MF";
    assert.equal(strip(input), input);
  });
});

describe("Best Buy", () => {
  it("should strip Best Buy redirect", () => {
    const input =
      "https://bestbuyca.something.net/click?u=https%3A%2F%2Fwww.bestbuy.ca%2Fen-ca%2Fproduct%2F12345";
    assert.equal(
      strip(input),
      "https://www.bestbuy.ca/en-ca/product/12345"
    );
  });
});

describe("HP (awin1.com clickref)", () => {
  it("should strip HP awin1 redirect", () => {
    const input =
      "https://www.awin1.com/cread.php?awinmid=12345&clickref=&p=https%3A%2F%2Fwww.hp.com%2Fca-en%2Fshop%2Fproduct";
    assert.equal(strip(input), "https://www.hp.com/ca-en/shop/product");
  });
});

describe("redirectingat.com", () => {
  it("should strip redirectingat.com with url param", () => {
    const input =
      "https://go.redirectingat.com/something?url=https%3A%2F%2Fwww.example.com%2Fproduct";
    assert.equal(strip(input), "https://www.example.com/product");
  });

  it("should strip go.redirectingat.com (alternate pattern)", () => {
    const input =
      "https://go.redirectingat.com/?id=12345&url=https%3A%2F%2Fwww.shop.com%2Fitem";
    assert.equal(strip(input), "https://www.shop.com/item");
  });
});

describe("Home Depot", () => {
  it("should strip Home Depot pxf.io redirect", () => {
    const input =
      "https://the-home-depot-ca.pxf.io/click?u=https%3A%2F%2Fwww.homedepot.ca%2Fproduct%2F1234";
    assert.equal(
      strip(input),
      "https://www.homedepot.ca/product/1234"
    );
  });
});

describe("sjv.io", () => {
  it("should strip sjv.io redirect", () => {
    const input =
      "https://something.sjv.io/click?u=https%3A%2F%2Fwww.store.com%2Fitem";
    assert.equal(strip(input), "https://www.store.com/item");
  });
});

describe("Canadian Tire", () => {
  it("should strip imp.i*.net redirect", () => {
    const input =
      "https://imp.i12345.net/click?u=https%3A%2F%2Fwww.canadiantire.ca%2Fen%2Fpdp%2Fitem";
    assert.equal(
      strip(input),
      "https://www.canadiantire.ca/en/pdp/item"
    );
  });
});

describe("Under Armour (awin1.com ued)", () => {
  it("should strip awin1.com ued redirect", () => {
    const input =
      "https://www.awin1.com/cread.php?awinmid=99999&ued=https%3A%2F%2Fwww.underarmour.com%2Fen-ca%2Fshoes";
    assert.equal(
      strip(input),
      "https://www.underarmour.com/en-ca/shoes"
    );
  });
});

describe("Lenovo (evyy.net)", () => {
  it("should strip evyy.net redirect", () => {
    const input =
      "https://lenovo.evyy.net/click?u=https%3A%2F%2Fwww.lenovo.com%2Fca%2Fen%2Fp%2Flaptops";
    assert.equal(
      strip(input),
      "https://www.lenovo.com/ca/en/p/laptops"
    );
  });
});

describe("kqzyfj.com", () => {
  it("should strip kqzyfj.com redirect", () => {
    const input =
      "https://www.kqzyfj.com/click-12345?url=https%3A%2F%2Fwww.store.com%2Fproduct&sid=rfd123";
    assert.equal(strip(input), "https://www.store.com/product");
  });
});

describe("Walmart (linksynergy)", () => {
  it("should strip linksynergy redirect", () => {
    const input =
      "https://click.linksynergy.com/deeplink?id=abcdef&murl=https%3A%2F%2Fwww.walmart.ca%2Fen%2Fip%2F12345&u1=rfd";
    assert.equal(
      strip(input),
      "https://www.walmart.ca/en/ip/12345"
    );
  });
});

describe("dpbolvw.net", () => {
  it("should strip dpbolvw.net redirect", () => {
    const input =
      "https://www.dpbolvw.net/click-12345?url=https%3A%2F%2Fwww.store.com%2Fdeals";
    assert.equal(strip(input), "https://www.store.com/deals");
  });
});

describe("jdoqocy.com", () => {
  it("should strip jdoqocy.com redirect", () => {
    const input =
      "https://www.jdoqocy.com/click-12345?url=https%3A%2F%2Fwww.store.com%2Fitem&sid=rfdcb";
    assert.equal(strip(input), "https://www.store.com/item");
  });
});

describe("pxf.io (generic)", () => {
  it("should strip generic pxf.io redirect", () => {
    const input =
      "https://something.pxf.io/click?u=https%3A%2F%2Fwww.retailer.com%2Fproduct";
    assert.equal(strip(input), "https://www.retailer.com/product");
  });
});

describe("avantlink.com", () => {
  it("should strip avantlink.com redirect", () => {
    const input =
      "https://merchant.avantlink.com/click?url=https%3A%2F%2Fwww.outdoorstore.com%2Fgear";
    assert.equal(
      strip(input),
      "https://www.outdoorstore.com/gear"
    );
  });
});

describe("anrdoezrs.net", () => {
  it("should strip anrdoezrs.net redirect", () => {
    const input =
      "https://www.anrdoezrs.net/click-12345?url=https%3A%2F%2Fwww.store.com%2Fitem&sid=rfd";
    assert.equal(strip(input), "https://www.store.com/item");
  });
});

describe("tkqlhce.com", () => {
  it("should strip tkqlhce.com redirect", () => {
    const input =
      "https://www.tkqlhce.com/click-12345?url=https%3A%2F%2Fwww.store.com%2Fproduct&sid=rfd";
    assert.equal(strip(input), "https://www.store.com/product");
  });
});

describe("Staples", () => {
  it("should strip Staples redirect", () => {
    const input =
      "https://staplescanada.4u8mqw.net/click?u=https%3A%2F%2Fwww.staples.ca%2Fproducts%2F12345";
    assert.equal(
      strip(input),
      "https://www.staples.ca/products/12345"
    );
  });
});

describe("pjtra.com", () => {
  it("should strip pjtra.com redirect", () => {
    const input =
      "https://www.pjtra.com/t/12345?url=https%3A%2F%2Fwww.store.com%2Fitem&sid=rfd";
    assert.equal(strip(input), "https://www.store.com/item");
  });
});

describe("pjatr.com", () => {
  it("should strip pjatr.com redirect", () => {
    const input =
      "https://www.pjatr.com/t/12345?url=https%3A%2F%2Fwww.store.com%2Fdeal&sid=rfd";
    assert.equal(strip(input), "https://www.store.com/deal");
  });
});

describe("pntra.com", () => {
  it("should strip pntra.com redirect", () => {
    const input =
      "https://www.pntra.com/t/12345?url=https%3A%2F%2Fwww.store.com%2Foffer&sid=rfd";
    assert.equal(strip(input), "https://www.store.com/offer");
  });
});

describe("pntrs.com", () => {
  it("should strip pntrs.com redirect", () => {
    const input =
      "https://www.pntrs.com/t/12345?url=https%3A%2F%2Fwww.store.com%2Fsale&sid=rfd";
    assert.equal(strip(input), "https://www.store.com/sale");
  });
});

describe("pntrac.com", () => {
  it("should strip pntrac.com redirect", () => {
    const input =
      "https://www.pntrac.com/t/12345?url=https%3A%2F%2Fwww.store.com%2Fpromo&sid=rfd";
    assert.equal(strip(input), "https://www.store.com/promo");
  });
});

describe("shareasale.com", () => {
  it("should strip shareasale.com redirect", () => {
    const input =
      "https://www.shareasale.com/r.cfm?b=12345&u=67890&m=11111&urllink=https%3A%2F%2Fwww.merchant.com%2Fproduct";
    assert.equal(
      strip(input),
      "https://www.merchant.com/product"
    );
  });
});

describe("mkr3.net", () => {
  it("should strip mkr3.net redirect", () => {
    const input =
      "https://www.mkr3.net/click?u=https%3A%2F%2Fwww.store.com%2Fitem";
    assert.equal(strip(input), "https://www.store.com/item");
  });
});

describe("fintelconnect.com", () => {
  it("should strip fintelconnect.com redirect", () => {
    const input =
      "https://www.fintelconnect.com/click?u=https%3A%2F%2Fwww.bank.com%2Foffer";
    assert.equal(strip(input), "https://www.bank.com/offer");
  });
});

describe("c2ukkg.net", () => {
  it("should strip c2ukkg.net redirect", () => {
    const input =
      "https://www.c2ukkg.net/click?u=https%3A%2F%2Fwww.store.com%2Fdeal";
    assert.equal(strip(input), "https://www.store.com/deal");
  });
});

describe("dodxnr.net", () => {
  it("should strip dodxnr.net redirect", () => {
    const input =
      "https://www.dodxnr.net/click?u=https%3A%2F%2Fwww.store.com%2Fsale";
    assert.equal(strip(input), "https://www.store.com/sale");
  });
});

describe("no match", () => {
  it("should not modify a URL that matches no rules", () => {
    const input = "https://www.example.com/page?foo=bar";
    assert.equal(strip(input), input);
  });

  it("should not modify a clean Amazon URL", () => {
    const input = "https://www.amazon.ca/dp/B0DFLGW8MF?th=1";
    assert.equal(strip(input), input);
  });

  it("should not modify a plain non-affiliate URL", () => {
    const input = "https://forums.redflagdeals.com/some-thread-12345/";
    assert.equal(strip(input), input);
  });
});

describe("Amazon search tracking params", () => {
  it("should strip crid, dib, dib_tag, and keywor tracking params from product URL", () => {
    const input =
      "https://www.amazon.ca/BenQ-MA270U-3840x2160-Brightness-Adjustable/dp/B0DBB63XGC?crid=2NC0L1MMU6GUL&dib=eyJ2IjoiMSJ9.YRX_QF7xfyuwLbRK4eDhDD0ge6ByREMzZ2_2d-2tyQrLpGDq_JzNfLdD9tIohutT1-U6yM5Ib-yU1dvTKZUqOasgdMIKFETTb0reWIy6YlH9BmCV1TKmWjyFJlhHdP7oQzB3iP-meiWKBEksviT2TofwNj6XiOprIxkSdvGKrjSJPfk9H2xgdijTYyNYZ3RkkWVgt9r5VNktIA_NAOMbQNb7QplOtW5EL-172yMREVRG3r6piSVWZB5iSTupr3RLh-6EfGL0WFTFNf7w9ftdBYuIHH2fF62JTsUAelU1wHU.lutkaUOcezaW5eFU8StdRu_Ms0COiSd8liK7yo_7FrM&dib_tag=se&keywor";
    const result = strip(input);
    assert.equal(
      result,
      "https://www.amazon.ca/BenQ-MA270U-3840x2160-Brightness-Adjustable/dp/B0DBB63XGC"
    );
  });

  it("should strip search tracking params from amazon.com product URL", () => {
    const input =
      "https://www.amazon.com/Some-Product/dp/B0TEST1234?crid=ABC&keywords=test&qid=123&sprefix=te";
    const result = strip(input);
    assert.equal(
      result,
      "https://www.amazon.com/Some-Product/dp/B0TEST1234"
    );
  });

  it("should not modify a clean Amazon product URL with no query params", () => {
    const input =
      "https://www.amazon.ca/BenQ-MA270U-3840x2160-Brightness-Adjustable/dp/B0DBB63XGC";
    assert.equal(strip(input), input);
  });
});

describe("real-world URLs", () => {
  it("should fully strip a real Amazon RFD affiliate URL with ref path + tag", () => {
    const input =
      "https://www.amazon.ca/BenQ-MA270U-3840x2160-Brightness-Adjustable/dp/B0DBB63XGC/ref=sr_1_1?crid=2NC0L1MMU6GUL&dib=eyJ2IjoiMSJ9.YRX_QF7xfyuwLbRK4eDhDD0ge6ByREMzZ2_2d-2tyQrLpGDq_JzNfLdD9tIohutT1-U6yM5Ib-yU1dvTKZUqOasgdMIKFETTb0reWIy6YlH9BmCV1TKmWjyFJlhHdP7oQzB3iP-meiWKBEksviT2TofwNj6XiOprIxkSdvGKrjSJPfk9H2xgdijTYyNYZ3RkkWVgt9r5VNktIA_NAOMbQNb7QplOtW5EL-172yMREVRG3r6piSVWZB5iSTupr3RLh-6EfGL0WFTFNf7w9ftdBYuIHH2fF62JTsUAelU1wHU.lutkaUOcezaW5eFU8StdRu_Ms0COiSd8liK7yo_7FrM&dib_tag=se&keywor&tag=redflagdealsc-20";
    const result = strip(input);
    assert.equal(
      result,
      "https://www.amazon.ca/BenQ-MA270U-3840x2160-Brightness-Adjustable/dp/B0DBB63XGC"
    );
    assert.ok(!result.includes("tag=redflagdealsc"), "affiliate tag should be stripped");
    assert.ok(!result.includes("/ref="), "ref path segment should be stripped");
    assert.ok(!result.includes("crid="), "search tracking params should be stripped");
    assert.ok(!result.includes("dib_tag="), "search tracking params should be stripped");
    assert.ok(
      result.includes("/dp/B0DBB63XGC"),
      "product ID should be preserved"
    );
  });

  it("should strip ref query param from real Amazon URL", () => {
    const input =
      "https://www.amazon.ca/dp/B0DFLGW8MF?ref=ppx_yo2ov_dt_b_fed_asin_title&th=1";
    const result = strip(input);
    assert.equal(result, "https://www.amazon.ca/dp/B0DFLGW8MF?th=1");
    assert.ok(!result.includes("ref="), "ref should be stripped");
    assert.ok(result.includes("th=1"), "th param should be preserved");
  });
});