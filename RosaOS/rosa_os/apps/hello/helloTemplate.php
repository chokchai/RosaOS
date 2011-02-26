<div id="tmpl_hello_dialog">
    <div class="hello">
        <div class="message">
            My ProcessID is, <span class="processID">${pid}</span><br/>
            ${message}, <span class="date">${datetime}</span><br/>
            <button id="button_signal">Send Signal</button>
        </div>
        <div id="signal_log">
            <b>Signal Log : </b>
        </div>
    </div>
</div>
<div id="tmpl_table_row">
    <div>
        <span class="counter">${counter}</span>
        <span class="type">${type}</span>
        <span class="processID">${processID}</span>
    </div>
</div>