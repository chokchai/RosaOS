            </div>
            <div class="wrap_buttons" >
                <?
                    $step_li = Array(); $i=0;
                    foreach($step_list as $val){
                        $step_li[] = $val;
                    }
                ?>
                <? if($step > 0): ?>
                <a class="button left" href="<?='../'.$step_li[$step-1]?>">Previous</a>
                <? endif; ?>
                <? if($step < count($step_li)-1): ?>
                <a class="button right" href="<?='../'.$step_li[$step+1]?>">Next</a>
                <? endif; ?>
            </div>
            <div class="footer">&copy; ROSA Operating System 2011 ( chokchai.puttan@gmail.com )</div>
        </div>
        <script> var BASE_URL = "<?=$base_url?>"; </script>
        <?php foreach ($js as $src): ?>
        <script src="<?='../'.$src?>" type="text/javascript"></script>
        <?php endforeach; ?>
    </body>
</html>
