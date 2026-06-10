// correctExp_sliderCtrl_E Ver.1.01
// Copyright (c) 2007-2020 Over Ray Studio・Takashi Aoki @voyager_vision. All rights reserved.
// LastUpDate 2020/10/04

//AfterEffectsCC以降の日本語版で作成されたエクスプレッション名を英語版用に最適化するスクリプト
//エフェクト名「スライダ制御」を「スライダー制御」に
//エクスプレッション文字列「スライダ制御」を「スライダー制御」に
//エクスプレッション文字列「スライダ」を「1」に
//エクスプレッション文字列「スライダー」を「1」に
//エクスプレッション文字列「チェックボックス」を「1」に
//エクスプレッション文字列「レイヤー」を「1」に
//エクスプレッション文字列「ポイント」を「1」に
//エクスプレッション文字列「カラー」を「1」に

app.beginUndoGroup("sliderCtrlSetUp");
var count = 0;
var fxStr0 = "スライダー制御";
var repStr0 = "スライダー制御";
var expStr1 = "\""+"スライダ制御"+"\"";
var repStr1 = "\""+"スライダー制御"+"\"";
var expStr2 = "\""+"スライダ"+"\"";
var repStr2 = 1;
var expStr3 = "\""+"スライダー"+"\"";
var repStr3 = 1;
var expStr4 = "\""+"チェックボックス"+"\"";
var repStr4 = 1;
var expStr5 = "\""+"レイヤー"+"\"";
var repStr5 = 1;
var expStr6 = "\""+"ポイント"+"\"";
var repStr6 = 1;
var expStr7 = "\""+"カラー"+"\"";
var repStr7 = 1;
//var repStr2 = "\""+"ADBE Slider Control-0001"+"\"";

var regexp1 = new RegExp( expStr1 ,"gm");
var regexp2 = new RegExp( expStr2 ,"gm");
var regexp3 = new RegExp( expStr3 ,"gm");
var regexp4 = new RegExp( expStr4 ,"gm");
var regexp5 = new RegExp( expStr5 ,"gm");
var regexp6 = new RegExp( expStr6 ,"gm");
var regexp7 = new RegExp( expStr7 ,"gm");

//エフェクト名「スライダ制御」を「スライダー制御」に
for ( var i = 1; i <= app.project.numItems; i++ )
{
	if (app.project.item(i) instanceof CompItem)
	{
		var curLayers = app.project.item(i).layers;
		for ( var s = 1; s <= curLayers.length; s++ )
		{
			for( var pp = 1; pp <= curLayers[s].numProperties; pp++ )
			{
				for( var p = 1; p <= curLayers[s].property(pp).numProperties; p++ )
				{
					var curProperty = curLayers[s].property(pp).property(p);
					if ( curProperty.name == fxStr0 ){curProperty.name = repStr0; count ++}
				}
			}
		}
	}
}

//エクスプレッション文字列「スライダ制御」を「スライダー制御」に
//エクスプレッション文字列「スライダ」を「1」に
//エクスプレッション文字列「スライダー」を「1」に
//エクスプレッション文字列「チェックボックス」を「1」に
//エクスプレッション文字列「レイヤー」を「1」に
//エクスプレッション文字列「ポイント」を「1」に
//エクスプレッション文字列「カラー」を「1」に

for ( var i = 1; i <= app.project.numItems; i++ )
{
	if (app.project.item(i) instanceof CompItem)
	{
		var curLayers = app.project.item(i).layers;
		for ( var s = 1; s <= curLayers.length; s++ )
		{
			for( var pp = 1; pp <= curLayers[s].numProperties; pp++ )
			{
				var curProperty = curLayers[s].property(pp);
				if ( curProperty.propertyType == PropertyType.PROPERTY )
				{
					if ( curProperty.canVaryOverTime == true )
					{
						if (curProperty.expression != "")
						{
							var curExp = curProperty.expression;
							if ( curExp.match(regexp1) || curExp.match(regexp2) || curExp.match(regexp3) || curExp.match(regexp4) || curExp.match(regexp5) || curExp.match(regexp6) || curExp.match(regexp7))
							{
								var newExp = curExp.replace( regexp1 , repStr1 );
								var newExp = newExp.replace( regexp2 , repStr2 );
								var newExp = newExp.replace( regexp3 , repStr3 );
								var newExp = newExp.replace( regexp4 , repStr4 );
								var newExp = newExp.replace( regexp5 , repStr5 );
								var newExp = newExp.replace( regexp6 , repStr6 );
								var newExp = newExp.replace( regexp7 , repStr7 );
								try { curProperty.expression = newExp; count ++; } catch (e){}
							}
						}
					}
				}
			
				for( var p = 1; p <= curLayers[s].property(pp).numProperties; p++ )
				{
					var curProperty = curLayers[s].property(pp).property(p);
					if ( curProperty.name == fxStr0 ){curProperty.name = repStr0; count ++}
					if ( curProperty.propertyType == PropertyType.PROPERTY )
					{
						if ( curProperty.canVaryOverTime == true )
						{
							if (curProperty.expression != "")
							{
								var curExp = curProperty.expression;
								if ( curExp.match(regexp1) || curExp.match(regexp2) || curExp.match(regexp3) || curExp.match(regexp4) || curExp.match(regexp5) || curExp.match(regexp6) || curExp.match(regexp7))
								{
									var newExp = curExp.replace( regexp1 , repStr1 );
									var newExp = newExp.replace( regexp2 , repStr2 );
									var newExp = newExp.replace( regexp3 , repStr3 );
									var newExp = newExp.replace( regexp4 , repStr4 );
									var newExp = newExp.replace( regexp5 , repStr5 );
									var newExp = newExp.replace( regexp6 , repStr6 );
									var newExp = newExp.replace( regexp7 , repStr7 );
									try { curProperty.expression = newExp; count ++; } catch (e){}
								}
							}
						}
					}
					if ( curProperty.propertyType == PropertyType.NAMED_GROUP  )
					{
						for( f = 1; f <= curProperty.numProperties; f++ )
						{
							if ( curProperty.property(f).propertyType == PropertyType.PROPERTY )
							{
								if ( curProperty.property(f).canVaryOverTime == true )
								{
									if (curProperty.property(f).expression != "")
									{
										var curExp = curProperty.property(f).expression;
										if ( curExp.match(regexp1) || curExp.match(regexp2) || curExp.match(regexp3) || curExp.match(regexp4) || curExp.match(regexp5) || curExp.match(regexp6) || curExp.match(regexp7))
										{
											var newExp = curExp.replace( regexp1 , repStr1 );
											var newExp = newExp.replace( regexp2 , repStr2 );
											var newExp = newExp.replace( regexp3 , repStr3 );
											var newExp = newExp.replace( regexp4 , repStr4 );
											var newExp = newExp.replace( regexp5 , repStr5 );
											var newExp = newExp.replace( regexp6 , repStr6 );
											var newExp = newExp.replace( regexp7 , repStr7 );
											try { curProperty.property(f).expression = newExp; count ++; } catch (e){}
										}
									}
								}
							}
						}
					}
				}
			}
		}
	}
}

app.endUndoGroup();

if ( count == 0 ){ alert("No results were found SliderCtrl to be processed."); }
if ( count == 1 ){alert("Fixed " + count + " sliderCtrl");}
if ( count > 1 ){alert("Fixed " + count + " sliderCtrls !");}
else if ( count > 10 ){alert("Fixed " + count + " sliderCtrls !!");}
else if ( count > 100 ){alert("Yay! Fixed " + count + " sliderCtrls !!!");}

// **** FUNCTION ******************************************************************************************************************
//		スクリプトファイルの実行
	function scriptExecute( scriptFilePath )
{
		var scriptFileName = new File( scriptFilePath );
		scriptFileName.open();
		eval(scriptFileName.read());
		scriptFileName.close();
}