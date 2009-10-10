
var Wa = new Object();

/*
 * configuratioin
 */
Wa.debug = false;

/*
 * app bootstrap
 */
Wa.init = function() {
    Wa.test();
    $('showList').disable();
};

Wa.compute = function() {

    var nProgress = 0;

    $('compute').disable();
    $('showList').disable();
    Wa.context = null;
    Wa.computeClassifications
    (3, 2, 1000,
     function(ctx) {
         Wa.context = ctx;
         $('showList').enable();
         $('compute').value = "computation is finished!";
     },
     function(ctx) {
         nProgress++;
         if (0 == nProgress%2) {
             $('compute').value = "computing ... (" + ctx.progress + "/" + ctx.nSteps + ")";
         }
     });
}

/*
 * view helper
 */

Wa.showList = function() {
    var d0 = $('digit0').options[$('digit0').selectedIndex].value;
    var d1 = $('digit1').options[$('digit1').selectedIndex].value;
    var np = parseInt($('nProblems').value);
    Wa.log(d0, d1, np);
    var key = d0 + d1;
    if (!Wa.context.results[key]) {
        $('notice').innerHTML = "no match";
        $('results').innerHTML = "";
    } else {
        $('notice').innerHTML = "";
        var arr = Wa.shuffle(Wa.context.results[key].clone());
        var h = Wa.formatTable(arr, $('results'), Math.min(np, arr.length));
        $('results').innerHTML = "<table>" + h + "</table>";
    }
};


Wa.formatTable = function(result, table, n) {
    var html = "";
    for (var i=0; i<n; ++i) {
        html += Wa.formatRowString(result[i]);
    }
  return html;
}

Wa.rowFormat = new Template("<tr><td>#{numer}</td><td>/</td><td>#{denom}</td><td>=</td><td>#{div}</td><td>mod</td><td>#{mod}</td></tr>");

Wa.formatRowString = function(item) {
    var data = {
        numer: item.numer,
        denom: item.denom,
        div: Wa.div(item.numer, item.denom),
        mod: (item.numer%item.denom)
    };
    return Wa.rowFormat.evaluate(data);
}

/*
 * util functions
 */
Wa.log = function() {
    if (Wa.debug) {
        console.log.apply(console, arguments);
    }
}

Wa.power = function(n, base)  {
    var ret = 1;
    for (var i=0; i<n; ++i) {
        ret = ret*base;
    }
    return ret;
};

Wa.round = function(n) {
    if (4 < n%10) {
        return Math.floor((n/10)+1)*10;
    } else {
        return Math.floor((n/10)+0)*10;
    }
};

Wa.div = function(n, d) {
    return Math.floor(n/d);
};

Wa.digits = function(n) {
    var ret = 1;
    while (10 <= n) {
        ret++;
        n /= 10;
    }
    return ret;
}

Wa.shuffle = function(v) {
    for(var j, x, i = v.length; i;
        j = Math.floor(Math.random() * i), x = v[--i], v[i] = v[j], v[j] = x);
    return v;
};

/*
 * the logic
 */
Wa.doClassify = function(numer, denom, wa) {
  var res = new Array();
  var ddigit;
  var ndigit;

  do {
    // div from upper digits
    udiv = Math.floor(Math.floor(numer/denom)/10)*10;
    // numer from upper digits
    var unum = numer - denom*udiv;
    // make an estimation and compare with actual value
    var rden = wa.round(denom);
    ediv = Math.floor(unum/rden);
    adiv = Math.floor(unum/denom);
    res.push(adiv - ediv);

    ddigit = wa.digits(denom);
    ndigit = wa.digits(numer);
    numer = Math.floor(numer/10);
  } while(ddigit < ndigit);

  return res;
};

Wa.makeKey = function(klass) {
  var ret = "";
  var kl = klass.length;
  for (var i=0; i<kl; ++i) {
    var n = klass[i];
        if (n <  0) { ret += "N"; }
        if (n == 0) { ret += "Z"; }
        if (n >  0) { ret += "P"; }
    };
  return ret;
}

Wa.classify = function(numer, denom) {
  var wa = Wa;
    var klass = wa.doClassify(numer, denom, wa);
  return {numer: numer, denom: denom, klass: klass, key: wa.makeKey(klass)};
}

  Wa.computeClassifications = function(numerDigit,denomDigit, stepWidth, notifyDone, notifyProgress) {

    var ctx = new Wa.Context(numerDigit,denomDigit);
    var nTimeout = 100;
    window.setTimeout(function doStep() {
        ctx.step(stepWidth);
        if (!ctx.done) {
            notifyProgress(ctx);
            window.setTimeout(doStep);
        } else {
            notifyDone(ctx);
        }
    });
};

/*
 * batch context holder
 */
Wa.Context = function(numerDigit,denomDigit) {

    this.results = new Object();
    this.done = false;
  this.progress = 0;

    var nmin = Wa.power(numerDigit-1, 10);
    var nmax = Wa.power(numerDigit+0, 10) - 1;
    var dmin = Wa.power(denomDigit-1, 10);
    var dmax = Wa.power(denomDigit+0, 10) - 1;

    var ni = nmin;
    var di = dmin;

  this.nSteps = (dmax - dmin)*(nmax - nmin);
    this.step = function(n) {
    var wa = Wa;
    var s = 0;
    var i = ni;
    var j = di;
    var nm = nmax;
    var dm = dmax;
    var res = this.results;
    var wadiv = wa.div;
    var waclassify = wa.classify;
        for (;i<nm; ++i) {
            for (;j<dm; ++j) {
                s++;
                var c = waclassify(i,j);
        var ckey = c.key;
        var arr = res[ckey];
                if (wadiv(c.numer, c.denom) < 10) { continue; }
                if (!arr) { res[ckey] = arr = new Array(); }
                arr.push(c);
                if (n <= s) {
          ni = i; di = j;
          this.progress += n;
          return;
        }
            }
            j = dmin;
        }

        wa.log("done");
        this.done = true;
    };

};

/*
 * tests
 */
Wa.check = function(cond, msg) {
    if (!cond) { Wa.log("error!", msg ? msg : ""); }
};

Wa.equalArray = function(x, y) {
    if (x.length != y.length) { false; }
    for (var i=0; i<x.length; ++i) {
        if (x[i] != y[i]) { return false; }
    }
    return true;
}

Wa.test = function() {
    Wa.check(Wa.round(14) == 10, "r14");
    Wa.check(Wa.round(15) == 20, "r20");
    Wa.check(Wa.round(114) == 110, "r114");
    Wa.check(Wa.round(115) == 120, "r120");
    Wa.check(Wa.power(0, 10) == 1, "p0");
    Wa.check(Wa.power(1, 10) == 10, "p1");
    Wa.check(Wa.power(2, 10) == 100, "p2");
    Wa.check(Wa.digits(1) == 1, "d1");
    Wa.check(Wa.digits(0) == 1, "d0");
    Wa.check(Wa.digits(0.5) == 1, "d05");
    Wa.check(Wa.digits(10) == 2, "d10");
    Wa.check(Wa.digits(20) == 2, "d20");
    Wa.check(Wa.digits(99) == 2, "d99");
    Wa.check(Wa.digits(100) == 3, "d100");
    Wa.check(Wa.digits(150) == 3, "d150");
    Wa.check(Wa.digits(999) == 3, "d900");

    Wa.check(Wa.equalArray([0,0], Wa.classify(659, 31).klass));
    Wa.check(Wa.equalArray([-1,-1], Wa.classify(639, 34).klass));
    Wa.check(Wa.equalArray([0,-1], Wa.classify(605, 11).klass));
    Wa.check(Wa.equalArray([-1,0], Wa.classify(747, 34).klass));
    Wa.check(Wa.equalArray([-2,-2], Wa.classify(600, 14).klass));

    Wa.check(Wa.makeKey([-1,-1]), "NN");
    Wa.check(Wa.makeKey([-1, 0]), "NZ");
    Wa.check(Wa.makeKey([ 1, 0]), "PZ");
};
