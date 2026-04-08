    // JavaScript Document
    // Author: Jeff Lin

    tree_node_search_lang = "cht";

    /*快速鍵Shift+Ctrl+F 判斷程式開始*/
    function chk_key(evt)
    {
        if(document.all) evt=event;
        if(70 == evt.keyCode && evt.ctrlKey && evt.shiftKey)
        {
            show_hide_search_block();
        }
    }
    window.document.onkeydown=chk_key;
    if(!document.all) window.document.captureEvents(Event.KEYDOWN);
    /*快速鍵判斷程式結束*/

    function tree_node_search(kw)
    {
        var tmp_desc;
        var tmp_link;
        //如果搜尋對象是英文版tree則keyword轉大寫
        if("eng" == tree_node_search_lang) kw=kw.toUpperCase();
        //每個aux一個個找
        for(j=0;j<100;j++)
        {
            //如果某aux編號物件不存在就跳過
            err_happen=false;
            eval("try{aux=aux".concat(j,";}catch(e){err_happen=true;}"));
            if(err_happen) continue;
            //找aux下的連結物件
            for(i=0;i<aux.children.length;i++)
            {
                //如果此物件不是連結就跳過
                if(null == aux.children[i].link) continue;
                //找關鍵字
                //如果搜尋對象是英文版tree則連結敘述轉大寫
                if("eng" == tree_node_search_lang)
                {
                    tmp_desc=aux.children[i].desc.toUpperCase();
                    tmp_link=aux.children[i].link.toUpperCase();
                }
                else
                {
                    tmp_desc=aux.children[i].desc;
                    tmp_link=aux.children[i].link;
                }
                if(-1 != tmp_desc.indexOf(kw) || -1 != tmp_link.indexOf(kw))
                {
                    document.getElementById('kw_result').innerHTML=document.getElementById('kw_result').innerHTML.concat("<a href=",aux.children[i].link,">",aux.children[i].desc,"</a><br>");
                }
            }

        }
        return false;
    }
    function show_hide_search_block()
    {
        if('none' == document.getElementById('tree_node_search_block').style.display)
        {
            document.getElementById('tree_node_search_block').style.display='block';
            document.getElementById('kw').focus();
        }
        else document.getElementById('tree_node_search_block').style.display='none';
    }
    document.write("<a href='#' style='font-size:small' onClick='show_hide_search_block()'>功能搜尋</a><div id='tree_node_search_block' style='display:none;background-color:yellow;'><form onSubmit='return tree_node_search(document.getElementById(\"kw\").value)'><input type='text' size='10' id='kw' value='功能搜尋' onFocus='this.value=\"\"'><input type='image' src='JH/search_img.jpg'></form><div id='kw_result'></div><hr><a href='#' style='font-size:x-small' onClick='document.getElementById(\"kw_result\").innerHTML=\"\"'>清空結果</a></div>");

