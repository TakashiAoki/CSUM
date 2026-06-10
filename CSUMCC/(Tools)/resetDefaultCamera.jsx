// resetDefaultCamera Ver 1.0.0
// Copyright (c) 2007-2023 Over Ray Studio・Takashi Aoki @voyager_vision. All rights reserved.
// LastUpDate 2023/04/18
// コンポジションのデフォルトカメラの位置・目標点・ズームをリセットする

// **** Main Script *****************************************************************************************************************

		resetDefaultCamera( curComp );

// **** FUNCTION ******************************************************************************************************************
//		デフォルトカメラの位置・目標点・ズームをリセット
		function resetDefaultCamera( comp )
{
		// デフォルトカメラアクセス用3Dシェイプレイヤー作成
		var tDshape = comp.layers.addShape();//新規シェイプレイヤー作成
		tDshape.threeDLayer = true;
		tDshape.selected = false;
		// カメラレイヤーを全てOFFに
		var onCamList = [];
		for ( rdc = 1; rdc <= comp.numLayers; rdc++ )
		{
			var curLayer = comp.layer(rdc);
			if ( curLayer instanceof CameraLayer )
			{
				if ( curLayer.enabled == true ) { onCamList.push( curLayer ); curLayer.enabled = false; }
			}
		}
		// デフォルトカメラの位置・目標点・ズームをリセット
		var defCam = comp.activeCamera;
		if ( defCam instanceof CameraLayer )
		{
			var zoom = comp.width/2/Math.tan(Math.atan2(36/2,50));//36mm幅フィルム:焦点距離50mmのZoom値
			defCam.zoom.setValue( zoom );
			defCam.position.setValue( [ comp.width/2,comp.height/2,-zoom ] );
			try { defCam.anchorPoint.setValue( [ comp.width/2,comp.height/2,0 ] );} catch(e) {}//1ノードカメラの場合のエラー回避
			defCam.orientation.setValue( [ 0,0,0 ] );
		}
		// OFFにしたカメラレイヤーをONに
		for ( rdc = 0; rdc < onCamList.length; rdc++ ) { onCamList[rdc].enabled = true; }
		// 3Dシェイプレイヤー削除
		tDshape.remove();
}
