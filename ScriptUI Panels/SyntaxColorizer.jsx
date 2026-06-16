// ============================================
// Script Name : SyntaxColorizer
// Version     : v1.1
// 仕様        : 選択テキストレイヤーをPygmentsで構文彩色。Live Text(編集可＋SC_エフェクト＋ワイプイン) / PNG(スクロール) を1ボタン適用
//             : v1.1 複数レイヤー一括適用＋背景は1コンポ1枚を最背面に配置(再作成しない)＋FUI装飾テキスト対応(sc_color.py)
// Copyright   : Over Ray Studio
// Author      : Takashi Aoki (with Elena)
// LastUpdate  : 2026-06-16
// 依存        : python3 + pygments(＋PNGモードはpillow)。重い解析はpythonに委譲(ASHのPython2地雷を回避)
// ============================================
#target aftereffects
(function(thisObj){

	// ---- CONFIG ----
	var CFG = {
		python: "python3", // 要 pip install pygments (PNGモードは pillow も)
		fontSize: 24, leading: 31, wipeFrac: 0.7, defaultTheme: "tokyo_night",
		scrollLPS: 6,    // PNGスクロール速度(行/秒)
		pngWindowLines: 16  // PNGスクロールコンプの表示窓(行数)
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
	function ymdhms(){ var d=new Date(); function p(n){return (n<10?"0":"")+n;}
		return d.getFullYear()+p(d.getMonth()+1)+p(d.getDate())+"-"+p(d.getHours())+p(d.getMinutes())+p(d.getSeconds()); }

	// PNG保存先: カット構造(aepの親が"AEP")なら <cut>/preRender/SyntaxColorizer、
	// それ以外の保存済みaepは <aep隣>/SyntaxColorizer。未保存はnull(呼び元でアラート)。
	function pngSaveDir(){
		var pf=app.project.file;
		if(!pf){ return null; }
		var aepFolder=pf.parent, dir;
		if(decodeURIComponent(aepFolder.name)==="AEP"){
			var pre=new Folder(aepFolder.parent.fsName+"/preRender");
			if(!pre.exists){ pre.create(); }
			dir=new Folder(pre.fsName+"/SyntaxColorizer");
		}else{
			dir=new Folder(aepFolder.fsName+"/SyntaxColorizer");
		}
		if(!dir.exists){ dir.create(); }
		return dir;
	}

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
	// 選択中のテキストレイヤーを全部(バッチ適用用)
	function selectedTextLayers(){
		var comp=app.project.activeItem;
		if(!comp || !(comp instanceof CompItem)){ return []; }
		var out=[], sel=comp.selectedLayers;
		for(var i=0;i<sel.length;i++){ try{ if(sel[i].property("ADBE Text Properties").property("ADBE Text Document")){ out.push(sel[i]); } }catch(e){} }
		return out;
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

	function findBgLayer(comp){
		for(var i=1;i<=comp.numLayers;i++){ if(comp.layer(i).name==="SC_BG"){ return comp.layer(i); } }
		return null;
	}
	// コンポサイズ追従の背景シェイプ。1コンポ1枚・常に最背面。既存があれば色だけ追従し再作成しない。
	function ensureBgLayer(comp, bgHex){
		if(!comp){ return "none"; }
		var existing=findBgLayer(comp);
		if(existing){
			try{ var ec=existing.property("ADBE Effect Parade").property("SC_background"); if(ec){ ec.property(1).setValue(hex(bgHex)); } }catch(e){}
			try{ existing.moveToEnd(); }catch(e){} // 最背面を維持
			existing.selected=false;
			return "reuse";
		}
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
		bg.moveToEnd(); // 最背面
		bg.selected=false;
		return "new";
	}

	// Live Text: 選択レイヤーにパレットEffect＋色アニメーター＋ワイプイン(背景はSC_apply側で1コンポ1枚管理)
	function applyLiveText(layer, data, wipeIn){
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
		return "Live Text: "+selN+" selectors, palette SC_×"+ (function(){var n=0;for(var x in ctrl){if(ctrl.hasOwnProperty(x))n++;}return n;})();
	}

	// PNG: 文字アルファPNGを書き出し → 取込 → 背景シェイプ+文字の2層スクロールコンプ
	// 文字=透明背景PNG(後からエフェクト可) / 背景=静止シェイプ / スクロール=Offsetで1行ステップ整数px・ループ
	function applyPNG(jsonPath, srcLayer, opts){
		var dir=pngSaveDir();
		if(dir===null){ throw new Error("Save the AEP first - PNG is written next to the project."); }
		var scale=opts.retina?2:1;
		var sz=CFG.fontSize*scale;
		var lh=Math.round(CFG.fontSize*1.3)*scale;          // PNG/コンプ空間の行高(整数)
		var baseHex=(readTheme(opts.theme).colors||{}).text || "#C8E0E5";
		var bgHex=(readTheme(opts.theme).colors||{}).background;
		var safe=String(srcLayer.name).replace(/[^\w\-]+/g,"_");
		var png=dir.fsName+"/SC_"+safe+"_"+opts.theme+"_"+ymdhms()+(scale>1?"@2x":"")+".png";
		var cmd=q(pythonExe())+" "+q(RENDER_PY)+" -i "+q(jsonPath)+" -o "+q(png)
			+" --size "+sz+" --leading "+lh+" --pad "+sz+" --alpha --loop --base "+q(baseHex);
		system.callSystem(cmd);
		var pf=new File(png);
		if(!pf.exists){ throw new Error("PNG render failed (pillow not installed?)"); }
		var foot=app.project.importFile(new ImportOptions(pf));
		var iw=foot.width, ih=foot.height;
		var winH=Math.min(ih, lh*CFG.pngWindowLines), dur=12, fps=24;
		var comp=app.project.items.addComp("SyntaxColorizer_PNG_"+safe, iw, Math.round(winH), 1, dur, fps);
		// 背景シェイプ(最背面・静止・テーマbg)
		if(bgHex){ try{ ensureBgLayer(comp, bgHex); }catch(e){} }
		// 文字アルファレイヤー(上端揃え)
		var lay=comp.layers.add(foot);
		try{ lay.moveToBeginning(); }catch(e){}
		lay.property("ADBE Transform Group").property("ADBE Position").setValue([iw/2, ih/2]); // 上端をコンプ天に
		// Offsetでループスクロール(1行ステップ・整数px・継ぎ目なし)
		var off=lay.property("ADBE Effect Parade").addProperty("ADBE Offset"); off.name="SC_scroll";
		var shift=off.property("ADBE Offset-0001"); // Shift Center To
		var expr="// SyntaxColorizer scroll: 1行ステップ / 整数px / ループ\n"
			+"lh="+lh+"; lps="+(CFG.scrollLPS||6)+";\n"
			+"step=Math.floor(time*lps);\n"
			+"[width/2, height/2 - step*lh];";
		try{ shift.expression=expr; }catch(e){}
		comp.openInViewer();
		return "PNG → "+decodeURIComponent(png.replace(/^.*\//,""))+"  ("+iw+"x"+ih+(scale>1?" 2x":"")+", loop scroll)";
	}

	// ---- メインロジック(UIボタン/テストから呼ぶ) ----
	// 選択中のテキストレイヤーを全部処理(バッチ)。彩色済みは色差し替えだけ(高速)、未彩色は新規彩色。
	// 背景はコンポに1枚だけ最背面へ。PNGモードは1レイヤー前提(先頭のみ)。
	function SC_apply(opts){
		var comp=app.project.activeItem;
		if(!comp || !(comp instanceof CompItem)){ return "ERR: open a comp"; }
		var layers=selectedTextLayers();
		if(layers.length===0){ return "ERR: select one or more text layers"; }

		// PNG: 1レイヤー前提(先頭の1枚のみスクロールコンプ化)
		if(opts.mode==="png"){
			var L0=layers[0];
			var raw0=String(L0.property("ADBE Text Properties").property("ADBE Text Document").value.text).replace(/\r\n/g,"\n").replace(/\r/g,"\n");
			var res0;
			try{ res0=colorize(raw0, opts.theme); }catch(e){ return "ERR colorize: "+e.toString(); }
			app.beginUndoGroup("SyntaxColorizer PNG");
			var m0;
			try{ m0=applyPNG(res0.jsonPath, L0, opts); }catch(e){ app.endUndoGroup(); return "ERR apply: "+e.toString()+" line="+(e.line||"?"); }
			app.endUndoGroup();
			return "OK ["+opts.theme+"] "+m0+(layers.length>1?"  (PNG: first layer only)":"");
		}

		// Live Text バッチ
		app.beginUndoGroup("SyntaxColorizer ("+layers.length+" layer"+(layers.length>1?"s":"")+")");
		var colored=0, rethemed=0, errs=[];
		for(var i=0;i<layers.length;i++){
			var L=layers[i];
			try{
				if(hasPalette(L)){ retheme(L, opts.theme); rethemed++; continue; } // 彩色済み=色だけ差し替え
				var text=String(L.property("ADBE Text Properties").property("ADBE Text Document").value.text).replace(/\r\n/g,"\n").replace(/\r/g,"\n");
				var res=colorize(text, opts.theme);
				applyLiveText(L, res.data, opts.wipeIn);
				colored++;
			}catch(e){ errs.push(L.name+":"+e.toString()); }
		}
		// 背景は1コンポ1枚・最背面
		var bgMsg="";
		if(opts.addBg){ try{ var bgHex=(readTheme(opts.theme).colors||{}).background; if(bgHex){ bgMsg=" + BG("+ensureBgLayer(comp, bgHex)+")"; } }catch(e){ bgMsg=" (BG err)"; } }
		// 選択をテキストレイヤーへ戻す(Reset等のため)
		try{ for(var s=1;s<=comp.numLayers;s++){ comp.layer(s).selected=false; } for(var t=0;t<layers.length;t++){ layers[t].selected=true; } }catch(e){}
		app.endUndoGroup();
		// 適用後にプロパティツリーを畳む: U=Reveal Properties with Keyframes(2387)。
		// SC_の色はexpression駆動でKFを持たないので選択レイヤーの全プロパティが閉じる(Wipe-in ON時はWIPE_INのみ残る)。
		if(opts.collapse){ try{ app.executeCommand(2387); }catch(e){} }
		var msg="OK ["+opts.theme+"] colored "+colored+", re-themed "+rethemed+" / "+layers.length+" layer"+(layers.length>1?"s":"")+bgMsg;
		if(errs.length){ msg+="  ERR:["+errs.join(" | ")+"]"; }
		return msg;
	}
	$.global.SC_apply = SC_apply; // DoScriptからのテスト用に公開

	// Reset: SC_関連(エフェクト＋テキストアニメーター＋背景レイヤー)を1クリックで除去し適用前へ
	// 選択テキストレイヤー全部が対象。選択が無ければコンプ内の彩色済みテキストを全部。SC_BGはコンプから一掃。
	function SC_reset(){
		var comp=app.project.activeItem;
		if(!comp || !(comp instanceof CompItem)){ return "ERR: open a comp"; }
		var layers=selectedTextLayers();
		if(layers.length===0){ // 選択無し → コンプ内の彩色済みテキスト全部
			for(var x=1;x<=comp.numLayers;x++){ var L=comp.layer(x);
				try{ if(L.property("ADBE Text Properties").property("ADBE Text Document") && hasPalette(L)){ layers.push(L); } }catch(e){}
			}
		}
		if(layers.length===0){ return "ERR: no colored text layer found"; }
		app.beginUndoGroup("SyntaxColorizer Reset");
		var n=0, lc=0;
		for(var li=0;li<layers.length;li++){
			var layer=layers[li]; lc++;
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
		}
		// 3) SC_BG 背景レイヤー(コンプに1枚想定だが複数あっても一掃)
		try{ for(var k=comp.numLayers;k>=1;k--){ if(comp.layer(k).name==="SC_BG"){ comp.layer(k).remove(); n++; } } }catch(e){}
		app.endUndoGroup();
		return "Reset: "+lc+" layer"+(lc>1?"s":"")+", removed "+n+" SC_ items (reverted)";
	}
	$.global.SC_reset = SC_reset;

	// ---- UI ----
	function buildUI(thisObj){
		var pnl = (thisObj instanceof Panel) ? thisObj : new Window("palette","SyntaxColorizer",undefined,{resizeable:true});
		pnl.alignChildren=["fill","top"]; pnl.spacing=8; pnl.margins=12;

		var info=pnl.add("statictext",undefined,"Colorize selected text layer(s) - multi-select OK"); info.alignment=["fill","top"];

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
		var cbCollapse=pnl.add("checkbox",undefined,"Collapse property tree after apply"); cbCollapse.value=true;
		var cbRetina=pnl.add("checkbox",undefined,"PNG: 2x (Retina) output"); cbRetina.value=false;

		var gBtn=pnl.add("group"); gBtn.orientation="row"; gBtn.alignment=["fill","top"]; gBtn.alignChildren=["fill","center"];
		var btn=gBtn.add("button",undefined,"Apply"); btn.preferredSize.width=220;
		var btnReset=gBtn.add("button",undefined,"Reset");
		var st=pnl.add("statictext",undefined,"",{multiline:true}); st.preferredSize.height=46; st.alignment=["fill","top"];

		btn.onClick=function(){
			st.text="Working... (first run may take a few seconds)";
			var opts={ mode: rbPng.value?"png":"text", theme: (ddTheme.selection?ddTheme.selection.text:""), wipeIn: cbWipe.value, addBg: cbBg.value, collapse: cbCollapse.value, retina: cbRetina.value };
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
