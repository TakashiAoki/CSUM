// ============================================
// Script Name : SyntaxColorizer
// Version     : v1.0
// 仕様        : 選択テキストレイヤーをPygmentsで構文彩色。Live Text(編集可＋SC_エフェクト＋ワイプイン) / PNG(スクロール) を1ボタン適用
// Copyright   : Over Ray Studio
// Author      : Takashi Aoki (with Elena)
// LastUpdate  : 2026-06-15
// 依存        : python3 + pygments(＋PNGモードはpillow)。重い解析はpythonに委譲(ASHのPython2地雷を回避)
// ============================================
#target aftereffects
(function(thisObj){

	// ---- CONFIG ----
	var CFG = {
		python: "python3", // 要 pip install pygments (PNGモードは pillow も)
		fontSize: 24, leading: 31, wipeFrac: 0.7, defaultTheme: "tokyo_night"
	};
	var TOOLDIR = File($.fileName).parent.fsName + "/(SyntaxColorizer)";
	var COLOR_PY  = TOOLDIR + "/sc_color.py";
	var RENDER_PY = TOOLDIR + "/sc_render.py";
	var THEMEDIR  = TOOLDIR + "/themes";
	var TMP = Folder.temp.fsName;

	function pythonExe(){ return (new File(CFG.python)).exists ? CFG.python : "python3"; }
	function q(s){ return '"' + s + '"'; }
	function hex(h){h=h.replace("#","");return [parseInt(h.substr(0,2),16)/255,parseInt(h.substr(2,2),16)/255,parseInt(h.substr(4,2),16)/255];}
	function wfile(p,s){var f=new File(p);f.encoding="UTF-8";f.open("w");f.write(s);f.close();}
	function rfile(p){var f=new File(p);f.encoding="UTF-8";f.open("r");var s=f.read();f.close();return s;}

	function listThemes(){
		var d=new Folder(THEMEDIR); var out=[];
		if(d.exists){ var fs=d.getFiles("*.json"); for(var i=0;i<fs.length;i++){ out.push(decodeURIComponent(fs[i].name).replace(/\.json$/,"")); } }
		out.sort(function(a,b){ var x=a.toLowerCase(), y=b.toLowerCase(); return x<y?-1:(x>y?1:0); }); // ABC順
		if(out.length===0){ out.push("(no themes folder)"); }
		return out;
	}

	function selectedTextLayer(){
		var comp=app.project.activeItem;
		if(!comp || !(comp instanceof CompItem)){ return null; }
		var sel=comp.selectedLayers;
		for(var i=0;i<sel.length;i++){ try{ if(sel[i].property("ADBE Text Properties").property("ADBE Text Document")){ return sel[i]; } }catch(e){} }
		return null;
	}

	function readTheme(themeName){ return eval("(" + rfile(THEMEDIR+"/"+themeName+".json") + ")"); }
	function hasPalette(layer){
		var fx=layer.property("ADBE Effect Parade");
		for(var i=1;i<=fx.numProperties;i++){ if(fx.property(i).name.indexOf("SC_")===0){ return true; } }
		return false;
	}
	// 既存SC_エフェクトの色だけ差し替え(再トークン化なし＝高速・二重適用回避)
	function retheme(layer, themeName){
		var cols=(readTheme(themeName).colors)||{};
		var fx=layer.property("ADBE Effect Parade"), n=0;
		for(var i=1;i<=fx.numProperties;i++){ var e=fx.property(i);
			if(e.name.indexOf("SC_")===0){ var kind=e.name.substr(3); if(cols[kind]){ e.property(1).setValue(hex(cols[kind])); n++; } }
		}
		// 背景レイヤー(SC_BG)の SC_background も追従
		try{ var comp=layer.containingComp, bgc=cols.background;
			if(comp && bgc){ for(var li=1;li<=comp.numLayers;li++){ var fe=comp.layer(li).property("ADBE Effect Parade");
				for(var pi=1;pi<=fe.numProperties;pi++){ if(fe.property(pi).name==="SC_background"){ fe.property(pi).property(1).setValue(hex(bgc)); n++; } } } }
		}catch(e){}
		return "Re-theme: "+n+" palette colors updated";
	}

	// python彩色 → 色レンジJSON(parse済)を返す
	function colorize(text, themeName){
		var tin=TMP+"/sc_in.txt", tjson=TMP+"/sc_colored.json";
		wfile(tin, text);
		var theme=THEMEDIR+"/"+themeName+".json";
		var cmd=q(pythonExe())+" "+q(COLOR_PY)+" -i "+q(tin)+" -t "+q(theme)+" -o "+q(tjson);
		system.callSystem(cmd);
		var jf=new File(tjson);
		if(!jf.exists){ throw new Error("colorize failed (pygments not installed?): "+cmd); }
		return { data: eval("("+rfile(tjson)+")"), jsonPath: tjson };
	}

	// AEセレクタは改行を数えない → index = offset - 改行数
	function makeAdj(text){ var pre=[],c=0; for(var k=0;k<=text.length;k++){pre[k]=c; if(text.charAt(k)==="\n"){c++;}} return function(p){return p-pre[p];}; }

	// コンポサイズ追従の背景シェイプを text の下に追加(テーマ背景色・SC_background でre-theme追従)
	function addBgLayer(layer, bgHex){
		var comp=layer.containingComp; if(!comp) return false;
		var bg=comp.layers.addShape(); bg.name="SC_BG";
		var grp=bg.property("ADBE Root Vectors Group").addProperty("ADBE Vector Group");
		var vg=grp.property("ADBE Vectors Group");
		var rect=vg.addProperty("ADBE Vector Shape - Rect");
		rect.property("ADBE Vector Rect Size").expression="[thisComp.width, thisComp.height]";
		var fill=vg.addProperty("ADBE Vector Graphic - Fill");
		var cc=bg.property("ADBE Effect Parade").addProperty("ADBE Color Control"); cc.name="SC_background"; cc.property(1).setValue(hex(bgHex));
		fill.property("ADBE Vector Fill Color").setValue(hex(bgHex));
		try{ fill.property("ADBE Vector Fill Color").expression='thisLayer.effect("SC_background")(1)'; }catch(e){}
		bg.property("ADBE Transform Group").property("ADBE Position").expression="[thisComp.width/2, thisComp.height/2]";
		bg.moveAfter(layer); // テキストの直下へ
		bg.selected=false; try{ layer.selected=true; }catch(e){} // 選択をテキストへ戻す(Reset等のため)
		return true;
	}

	// Live Text: 選択レイヤーにパレットEffect＋色アニメーター＋ワイプイン(＋任意で背景)
	function applyLiveText(layer, data, wipeIn, bgHex, addBg){
		var adj=makeAdj(data.text);
		var byKind={};
		for(var i=0;i<data.spans.length;i++){ var sp=data.spans[i]; var kk=sp.kind;
			if(!byKind[kk]){ byKind[kk]={color:sp.color,ranges:[]}; }
			if(sp.start!==sp.end && kk!=="text"){ byKind[kk].ranges.push([adj(sp.start),adj(sp.end)]); }
		}
		var fx=layer.property("ADBE Effect Parade"), ctrl={};
		for(var kind in byKind){ if(!byKind.hasOwnProperty(kind))continue;
			var cc=fx.addProperty("ADBE Color Control"); cc.name="SC_"+kind;
			cc.property(1).setValue(hex(byKind[kind].color)); ctrl[kind]="SC_"+kind;
		}
		var anims=layer.property("ADBE Text Properties").property("ADBE Text Animators");
		if(byKind["text"]){
			var ba=anims.addProperty("ADBE Text Animator"); ba.name="BASE";
			var bf=ba.property("ADBE Text Animator Properties").addProperty("ADBE Text Fill Color");
			bf.setValue(hex(byKind["text"].color));
			try{ bf.expression='thisLayer.effect("'+ctrl["text"]+'")(1)'; }catch(e){}
		}
		var selN=0;
		for(var kind2 in byKind){ if(!byKind.hasOwnProperty(kind2))continue; if(kind2==="text")continue;
			var ranges=byKind[kind2].ranges; if(ranges.length===0)continue;
			var an=anims.addProperty("ADBE Text Animator"); an.name=kind2;
			var fc=an.property("ADBE Text Animator Properties").addProperty("ADBE Text Fill Color");
			fc.setValue(hex(byKind[kind2].color));
			try{ fc.expression='thisLayer.effect("'+ctrl[kind2]+'")(1)'; }catch(e){}
			var sels=an.property("ADBE Text Selectors");
			for(var r=0;r<ranges.length;r++){
				var sel=sels.addProperty("ADBE Text Selector");
				var adv=sel.property("ADBE Text Range Advanced");
				adv.property("ADBE Text Range Units").setValue(2);
				adv.property("ADBE Text Selector Smoothness").setValue(0);
				sel.property("ADBE Text Index Start").setValue(ranges[r][0]);
				sel.property("ADBE Text Index End").setValue(ranges[r][1]);
				selN++;
			}
		}
		if(wipeIn){
			var comp=app.project.activeItem;
			var wan=anims.addProperty("ADBE Text Animator"); wan.name="WIPE_IN";
			wan.property("ADBE Text Animator Properties").addProperty("ADBE Text Opacity").setValue(0);
			var wsel=wan.property("ADBE Text Selectors").addProperty("ADBE Text Selector");
			try{ wsel.property("ADBE Text Range Advanced").property("ADBE Text Selector Smoothness").setValue(0); }catch(e){}
			var ps=wsel.property("ADBE Text Percent Start");
			ps.setValueAtTime(comp.time, 0); ps.setValueAtTime(comp.time + comp.duration*CFG.wipeFrac, 100);
		}
		var bgMsg="";
		if(addBg && bgHex){ try{ if(addBgLayer(layer, bgHex)) bgMsg=" + BG"; }catch(e){ bgMsg=" (BG err)"; } }
		return "Live Text: "+selN+" selectors, palette "+ "SC_×"+ (function(){var n=0;for(var x in ctrl){if(ctrl.hasOwnProperty(x))n++;}return n;})() + bgMsg;
	}

	// PNG: 色付き画像化 → 取込 → スクロールコンプ
	function applyPNG(jsonPath, srcLayer){
		var png=TMP+"/sc_render.png";
		var cmd=q(pythonExe())+" "+q(RENDER_PY)+" -i "+q(jsonPath)+" -o "+q(png)+" --size "+CFG.fontSize;
		system.callSystem(cmd);
		if(!(new File(png)).exists){ throw new Error("PNG render failed (pillow not installed?)"); }
		var foot=app.project.importFile(new ImportOptions(new File(png)));
		var iw=foot.width, ih=foot.height, winH=Math.min(ih, 900), dur=12, fps=24;
		var comp=app.project.items.addComp("SyntaxColorizer_PNG", iw, winH, 1, dur, fps);
		var lay=comp.layers.add(foot);
		var pos=lay.property("ADBE Transform Group").property("ADBE Position");
		pos.setValueAtTime(0,[iw/2, ih/2]);
		pos.setValueAtTime(dur,[iw/2, winH - ih/2]);
		comp.openInViewer();
		return "PNG: "+iw+"x"+ih+" → scroll comp";
	}

	// ---- メインロジック(UIボタン/テストから呼ぶ) ----
	function SC_apply(opts){
		var layer=selectedTextLayer();
		if(!layer){ return "ERR: select a text layer"; }
		// 既に彩色済み(SC_あり)＆Live Text → パレットだけ高速差し替え(再トークン化しない・二重適用回避)
		if(opts.mode!=="png" && hasPalette(layer)){
			app.beginUndoGroup("SyntaxColorizer Re-theme");
			var rmsg;
			try{ rmsg=retheme(layer, opts.theme); }catch(e){ app.endUndoGroup(); return "ERR retheme: "+e.toString(); }
			app.endUndoGroup();
			return "OK ["+opts.theme+"] "+rmsg+" (palette-only / fast)";
		}
		var raw=String(layer.property("ADBE Text Properties").property("ADBE Text Document").value.text);
		var text=raw.replace(/\r\n/g,"\n").replace(/\r/g,"\n");
		var res;
		try{ res=colorize(text, opts.theme); }catch(e){ return "ERR colorize: "+e.toString(); }
		app.beginUndoGroup("SyntaxColorizer");
		var msg;
		try{
			if(opts.mode==="png"){ msg=applyPNG(res.jsonPath, layer); }
			else{ var bgHex=(readTheme(opts.theme).colors||{}).background; msg=applyLiveText(layer, res.data, opts.wipeIn, bgHex, opts.addBg); }
		}catch(e){ app.endUndoGroup(); return "ERR apply: "+e.toString()+" line="+(e.line||"?"); }
		app.endUndoGroup();
		return "OK ["+opts.theme+"] "+msg;
	}
	$.global.SC_apply = SC_apply; // DoScriptからのテスト用に公開

	// Reset: 選択レイヤーからSC_関連(エフェクト＋テキストアニメーター＋背景レイヤー)を1クリックで除去し適用前へ
	function SC_reset(){
		var layer=selectedTextLayer();
		if(!layer){ // 選択が外れてても: アクティブコンプ内のSC_彩色済みテキストを自動検出
			var ac=app.project.activeItem;
			if(ac && (ac instanceof CompItem)){
				for(var x=1;x<=ac.numLayers;x++){ var L=ac.layer(x);
					try{ if(L.property("ADBE Text Properties").property("ADBE Text Document") && hasPalette(L)){ layer=L; break; } }catch(e){}
				}
			}
		}
		if(!layer){ return "ERR: select the colored text layer"; }
		app.beginUndoGroup("SyntaxColorizer Reset");
		var n=0;
		// 1) テキストアニメーター(自分のもの: BASE/WIPE_IN、またはFill色expressionがSC_参照)
		try{ var anims=layer.property("ADBE Text Properties").property("ADBE Text Animators");
			for(var i=anims.numProperties;i>=1;i--){ var an=anims.property(i), ours=false, nm=an.name;
				if(nm==="BASE"||nm==="WIPE_IN"){ ours=true; }
				else{ try{ var fc=an.property("ADBE Text Animator Properties").property("ADBE Text Fill Color");
					if(fc && fc.expression && fc.expression.indexOf("SC_")>=0){ ours=true; } }catch(e){} }
				if(ours){ an.remove(); n++; }
			}
		}catch(e){}
		// 2) SC_エフェクト
		try{ var fx=layer.property("ADBE Effect Parade");
			for(var j=fx.numProperties;j>=1;j--){ if(fx.property(j).name.indexOf("SC_")===0){ fx.property(j).remove(); n++; } }
		}catch(e){}
		// 3) SC_BG 背景レイヤー
		try{ var comp=layer.containingComp;
			for(var k=comp.numLayers;k>=1;k--){ if(comp.layer(k).name==="SC_BG"){ comp.layer(k).remove(); n++; } }
		}catch(e){}
		app.endUndoGroup();
		return "Reset: removed "+n+" SC_ items (reverted)";
	}
	$.global.SC_reset = SC_reset;

	// ---- UI ----
	function buildUI(thisObj){
		var pnl = (thisObj instanceof Panel) ? thisObj : new Window("palette","SyntaxColorizer",undefined,{resizeable:true});
		pnl.alignChildren=["fill","top"]; pnl.spacing=8; pnl.margins=12;

		var info=pnl.add("statictext",undefined,"Colorize the selected text layer"); info.alignment=["fill","top"];

		var gMode=pnl.add("panel",undefined,"Mode"); gMode.orientation="row"; gMode.alignChildren="left"; gMode.margins=10;
		var rbText=gMode.add("radiobutton",undefined,"Live Text"); var rbPng=gMode.add("radiobutton",undefined,"PNG (scroll)");
		rbText.value=true;

		var gTheme=pnl.add("group"); gTheme.orientation="row";
		gTheme.add("statictext",undefined,"Theme:");
		var themeList=listThemes();
		var ddTheme=gTheme.add("dropdownlist",undefined,themeList); ddTheme.preferredSize.width=160;
		(function(){ var di=0; for(var ti=0;ti<themeList.length;ti++){ if(themeList[ti]===CFG.defaultTheme){ di=ti; break; } } ddTheme.selection=di; })();

		// --- パレット色見本(選択テーマと同期・読み取り表示) ---
		var swPanel=pnl.add("panel",undefined,"Palette"); swPanel.orientation="row"; swPanel.alignChildren=["left","top"]; swPanel.margins=8; swPanel.spacing=14;
		var LABELS={background:"Background",text:"Default",time:"Time",delim:"Delim",module:"Module","level.info":"INFO","level.warn":"WARN","level.alert":"ALERT","level.debug":"DEBUG","level.trace":"TRACE","code.keyword":"Keyword","code.name":"Ident","code.string":"String","code.number":"Number","code.operator":"Operator","code.comment":"Comment",meta:"Meta"};
		var ORDER=["text","time","delim","module","level.info","level.warn","level.alert","level.debug","level.trace","code.keyword","code.name","code.string","code.number","code.operator","code.comment","meta","background"];
		function swDraw(){ var g=this.graphics,s=this.size,c=this.fillArr||[0,0,0]; var b=g.newBrush(g.BrushType.SOLID_COLOR,[c[0],c[1],c[2],1]); g.newPath(); g.rectPath(0,0,s[0],s[1]); g.fillPath(b); }
		function renderSwatches(themeName){
			while(swPanel.children.length>0){ swPanel.remove(swPanel.children[0]); }
			var cols={}; try{ cols=(readTheme(themeName).colors)||{}; }catch(e){}
			var colA=swPanel.add("group"); colA.orientation="column"; colA.alignChildren="left"; colA.spacing=3;
			var colB=swPanel.add("group"); colB.orientation="column"; colB.alignChildren="left"; colB.spacing=3;
			var idx=0;
			for(var i=0;i<ORDER.length;i++){ var kind=ORDER[i]; if(!cols[kind])continue;
				var row=(idx%2===0?colA:colB).add("group"); row.orientation="row"; row.spacing=6; row.alignChildren=["left","center"];
				var lbl=row.add("statictext",undefined,(LABELS[kind]||kind)); lbl.preferredSize.width=66;
				var sw=row.add("panel"); sw.preferredSize=[30,13]; sw.fillArr=hex(cols[kind]); sw.onDraw=swDraw;
				var hx=row.add("statictext",undefined,String(cols[kind]).toUpperCase()); hx.preferredSize.width=62;
				idx++;
			}
			pnl.layout.layout(true);
		}
		ddTheme.onChange=function(){ if(ddTheme.selection){ renderSwatches(ddTheme.selection.text); } };

		var cbWipe=pnl.add("checkbox",undefined,"Wipe-in (per-character)"); cbWipe.value=false;
		var cbBg=pnl.add("checkbox",undefined,"Add background layer (comp-size)"); cbBg.value=true;

		var gBtn=pnl.add("group"); gBtn.orientation="row"; gBtn.alignment=["fill","top"]; gBtn.alignChildren=["fill","center"];
		var btn=gBtn.add("button",undefined,"Apply"); btn.preferredSize.width=220;
		var btnReset=gBtn.add("button",undefined,"Reset");
		var st=pnl.add("statictext",undefined,"",{multiline:true}); st.preferredSize.height=46; st.alignment=["fill","top"];

		btn.onClick=function(){
			st.text="Working... (first run may take a few seconds)";
			var opts={ mode: rbPng.value?"png":"text", theme: (ddTheme.selection?ddTheme.selection.text:""), wipeIn: cbWipe.value, addBg: cbBg.value };
			st.text=SC_apply(opts);
		};
		btnReset.onClick=function(){ st.text=SC_reset(); };

		if(ddTheme.selection){ renderSwatches(ddTheme.selection.text); }
		if(pnl instanceof Window){ pnl.center(); pnl.show(); }
		else{ pnl.layout.layout(true); }
		return pnl;
	}
	buildUI(thisObj);

})(this);
