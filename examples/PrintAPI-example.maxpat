{
	"patcher" : 	{
		"fileversion" : 1,
		"appversion" : 		{
			"major" : 8,
			"minor" : 6,
			"revision" : 0,
			"architecture" : "x64",
			"modernui" : 1
		}
,
		"classnamespace" : "box",
		"rect" : [ 100.0, 100.0, 750.0, 850.0 ],
		"bglocked" : 0,
		"openinpresentation" : 0,
		"default_fontsize" : 12.0,
		"default_fontface" : 0,
		"default_fontname" : "Arial",
		"gridonopen" : 1,
		"gridsize" : [ 15.0, 15.0 ],
		"gridsnaponopen" : 1,
		"objectsnaponopen" : 1,
		"statusbarvisible" : 2,
		"toolbarvisible" : 1,
		"lefttoolbarpinned" : 0,
		"toptoolbarpinned" : 0,
		"righttoolbarpinned" : 0,
		"bottomtoolbarpinned" : 0,
		"toolbars_unpinned_last_save" : 0,
		"tallnewobj" : 0,
		"boxanimatetime" : 200,
		"enablehscroll" : 1,
		"enablevscroll" : 1,
		"devicewidth" : 0.0,
		"description" : "",
		"digest" : "",
		"tags" : "",
		"style" : "",
		"subpatcher_template" : "",
		"assistshowspatchername" : 0,
		"boxes" : [ 			{
				"box" : 				{
					"id" : "obj-title",
					"maxclass" : "comment",
					"numinlets" : 1,
					"numoutlets" : 0,
					"patching_rect" : [ 30.0, 20.0, 500.0, 20.0 ],
					"text" : "PrintAPI Example - Thermal Printer Control via OSC",
					"fontsize" : 14.0,
					"fontface" : 1
				}

			}
, 			{
				"box" : 				{
					"id" : "obj-subtitle",
					"maxclass" : "comment",
					"numinlets" : 1,
					"numoutlets" : 0,
					"patching_rect" : [ 30.0, 45.0, 500.0, 20.0 ],
					"text" : "PrintAPI.appを起動してから使用 (OSC default port: 9000)"
				}

			}
, 			{
				"box" : 				{
					"id" : "obj-udpsend",
					"maxclass" : "newobj",
					"numinlets" : 1,
					"numoutlets" : 0,
					"patching_rect" : [ 550.0, 750.0, 130.0, 22.0 ],
					"text" : "udpsend localhost 9000"
				}

			}
, 			{
				"box" : 				{
					"id" : "obj-section1",
					"maxclass" : "comment",
					"numinlets" : 1,
					"numoutlets" : 0,
					"patching_rect" : [ 30.0, 80.0, 250.0, 20.0 ],
					"text" : "--- 1. テキスト印刷 ---",
					"fontface" : 1
				}

			}
, 			{
				"box" : 				{
					"id" : "obj-text-btn",
					"maxclass" : "button",
					"numinlets" : 1,
					"numoutlets" : 1,
					"outlettype" : [ "bang" ],
					"parameter_enable" : 0,
					"patching_rect" : [ 30.0, 105.0, 40.0, 40.0 ]
				}

			}
, 			{
				"box" : 				{
					"id" : "obj-text-msg",
					"maxclass" : "message",
					"numinlets" : 2,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 30.0, 155.0, 400.0, 22.0 ],
					"text" : "/print/text \"Hello from Max!\" center 0 2 2"
				}

			}
, 			{
				"box" : 				{
					"id" : "obj-text-comment",
					"maxclass" : "comment",
					"numinlets" : 1,
					"numoutlets" : 0,
					"patching_rect" : [ 80.0, 115.0, 350.0, 20.0 ],
					"text" : "テキスト [data, alignment, attribute, widthMult, heightMult]"
				}

			}
, 			{
				"box" : 				{
					"id" : "obj-section2",
					"maxclass" : "comment",
					"numinlets" : 1,
					"numoutlets" : 0,
					"patching_rect" : [ 30.0, 195.0, 250.0, 20.0 ],
					"text" : "--- 2. QRコード印刷 ---",
					"fontface" : 1
				}

			}
, 			{
				"box" : 				{
					"id" : "obj-qr-btn",
					"maxclass" : "button",
					"numinlets" : 1,
					"numoutlets" : 1,
					"outlettype" : [ "bang" ],
					"parameter_enable" : 0,
					"patching_rect" : [ 30.0, 220.0, 40.0, 40.0 ]
				}

			}
, 			{
				"box" : 				{
					"id" : "obj-qr-msg",
					"maxclass" : "message",
					"numinlets" : 2,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 30.0, 270.0, 350.0, 22.0 ],
					"text" : "/print/qrcode https://example.com 8 M center"
				}

			}
, 			{
				"box" : 				{
					"id" : "obj-qr-comment",
					"maxclass" : "comment",
					"numinlets" : 1,
					"numoutlets" : 0,
					"patching_rect" : [ 80.0, 230.0, 350.0, 20.0 ],
					"text" : "QR [data, moduleSize, ecLevel, alignment]"
				}

			}
, 			{
				"box" : 				{
					"id" : "obj-section3",
					"maxclass" : "comment",
					"numinlets" : 1,
					"numoutlets" : 0,
					"patching_rect" : [ 30.0, 310.0, 250.0, 20.0 ],
					"text" : "--- 3. 紙送り ---",
					"fontface" : 1
				}

			}
, 			{
				"box" : 				{
					"id" : "obj-feed-btn",
					"maxclass" : "button",
					"numinlets" : 1,
					"numoutlets" : 1,
					"outlettype" : [ "bang" ],
					"parameter_enable" : 0,
					"patching_rect" : [ 30.0, 335.0, 40.0, 40.0 ]
				}

			}
, 			{
				"box" : 				{
					"id" : "obj-feed-msg",
					"maxclass" : "message",
					"numinlets" : 2,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 30.0, 385.0, 150.0, 22.0 ],
					"text" : "/print/feed 5"
				}

			}
, 			{
				"box" : 				{
					"id" : "obj-feed-comment",
					"maxclass" : "comment",
					"numinlets" : 1,
					"numoutlets" : 0,
					"patching_rect" : [ 80.0, 345.0, 200.0, 20.0 ],
					"text" : "紙送り [units]"
				}

			}
, 			{
				"box" : 				{
					"id" : "obj-section4",
					"maxclass" : "comment",
					"numinlets" : 1,
					"numoutlets" : 0,
					"patching_rect" : [ 30.0, 425.0, 250.0, 20.0 ],
					"text" : "--- 4. カット ---",
					"fontface" : 1
				}

			}
, 			{
				"box" : 				{
					"id" : "obj-cut-btn",
					"maxclass" : "button",
					"numinlets" : 1,
					"numoutlets" : 1,
					"outlettype" : [ "bang" ],
					"parameter_enable" : 0,
					"patching_rect" : [ 30.0, 450.0, 40.0, 40.0 ]
				}

			}
, 			{
				"box" : 				{
					"id" : "obj-cut-msg",
					"maxclass" : "message",
					"numinlets" : 2,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 30.0, 500.0, 150.0, 22.0 ],
					"text" : "/print/cut partial"
				}

			}
, 			{
				"box" : 				{
					"id" : "obj-cut-comment",
					"maxclass" : "comment",
					"numinlets" : 1,
					"numoutlets" : 0,
					"patching_rect" : [ 80.0, 460.0, 300.0, 20.0 ],
					"text" : "カット [percentage: full/partial/fullPrefeed/partialPrefeed]"
				}

			}
, 			{
				"box" : 				{
					"id" : "obj-section5",
					"maxclass" : "comment",
					"numinlets" : 1,
					"numoutlets" : 0,
					"patching_rect" : [ 30.0, 540.0, 250.0, 20.0 ],
					"text" : "--- 5. バーコード ---",
					"fontface" : 1
				}

			}
, 			{
				"box" : 				{
					"id" : "obj-barcode-btn",
					"maxclass" : "button",
					"numinlets" : 1,
					"numoutlets" : 1,
					"outlettype" : [ "bang" ],
					"parameter_enable" : 0,
					"patching_rect" : [ 30.0, 565.0, 40.0, 40.0 ]
				}

			}
, 			{
				"box" : 				{
					"id" : "obj-barcode-msg",
					"maxclass" : "message",
					"numinlets" : 2,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 30.0, 615.0, 350.0, 22.0 ],
					"text" : "/print/barcode 1234567890 CODE128 80 2 center below"
				}

			}
, 			{
				"box" : 				{
					"id" : "obj-barcode-comment",
					"maxclass" : "comment",
					"numinlets" : 1,
					"numoutlets" : 0,
					"patching_rect" : [ 80.0, 575.0, 400.0, 20.0 ],
					"text" : "バーコード [data, type, height, width, alignment, hriPosition]"
				}

			}
, 			{
				"box" : 				{
					"id" : "obj-section6",
					"maxclass" : "comment",
					"numinlets" : 1,
					"numoutlets" : 0,
					"patching_rect" : [ 30.0, 655.0, 250.0, 20.0 ],
					"text" : "--- 6. ドロワー ---",
					"fontface" : 1
				}

			}
, 			{
				"box" : 				{
					"id" : "obj-drawer-btn",
					"maxclass" : "button",
					"numinlets" : 1,
					"numoutlets" : 1,
					"outlettype" : [ "bang" ],
					"parameter_enable" : 0,
					"patching_rect" : [ 30.0, 680.0, 40.0, 40.0 ]
				}

			}
, 			{
				"box" : 				{
					"id" : "obj-drawer-msg",
					"maxclass" : "message",
					"numinlets" : 2,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 30.0, 730.0, 150.0, 22.0 ],
					"text" : "/print/drawer 1 100"
				}

			}
, 			{
				"box" : 				{
					"id" : "obj-drawer-comment",
					"maxclass" : "comment",
					"numinlets" : 1,
					"numoutlets" : 0,
					"patching_rect" : [ 80.0, 690.0, 250.0, 20.0 ],
					"text" : "ドロワーを開く [drawer, pulseLength]"
				}

			}
, 			{
				"box" : 				{
					"id" : "obj-note",
					"maxclass" : "comment",
					"numinlets" : 1,
					"numoutlets" : 0,
					"patching_rect" : [ 30.0, 780.0, 500.0, 20.0 ],
					"text" : "OSC Address: /print/text, /print/qrcode, /print/feed, /print/cut, /print/barcode, /print/drawer"
				}

			}
, 			{
				"box" : 				{
					"id" : "obj-note2",
					"maxclass" : "comment",
					"numinlets" : 1,
					"numoutlets" : 0,
					"patching_rect" : [ 30.0, 800.0, 500.0, 20.0 ],
					"text" : "Port変更: 環境変数 OSC_PORT=xxxx で起動、またはudpsendのポート番号を変更"
				}

			}
 ],
		"lines" : [ 			{
				"patchline" : 				{
					"destination" : [ "obj-text-msg", 0 ],
					"source" : [ "obj-text-btn", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-udpsend", 0 ],
					"source" : [ "obj-text-msg", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-qr-msg", 0 ],
					"source" : [ "obj-qr-btn", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-udpsend", 0 ],
					"source" : [ "obj-qr-msg", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-feed-msg", 0 ],
					"source" : [ "obj-feed-btn", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-udpsend", 0 ],
					"source" : [ "obj-feed-msg", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-cut-msg", 0 ],
					"source" : [ "obj-cut-btn", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-udpsend", 0 ],
					"source" : [ "obj-cut-msg", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-barcode-msg", 0 ],
					"source" : [ "obj-barcode-btn", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-udpsend", 0 ],
					"source" : [ "obj-barcode-msg", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-drawer-msg", 0 ],
					"source" : [ "obj-drawer-btn", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-udpsend", 0 ],
					"source" : [ "obj-drawer-msg", 0 ]
				}

			}
 ],
		"dependency_cache" : [  ],
		"autosave" : 0
	}

}
